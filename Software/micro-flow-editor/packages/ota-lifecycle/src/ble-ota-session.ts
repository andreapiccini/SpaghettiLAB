import { domainError, type DomainError } from "@spaghettilab/domain";
import { PreflightOutcome, type OtaCandidateManifest, type PreflightResult } from "@spaghettilab/ota-preflight";
import type { BleUpdateSessionRequest, OpenBleUpdateRequest, OpenBleUpdateResponse, WriteBleUpdateRequest } from "@spaghettilab/protocol-sdk";
import { OtaLifecycleErrorCode } from "./errors.js";

export type BleOtaWireClient = {
  openBleUpdate(req: OpenBleUpdateRequest): Promise<OpenBleUpdateResponse>;
  writeBleUpdate(req: WriteBleUpdateRequest): Promise<void>;
  finishBleUpdate(req: BleUpdateSessionRequest): Promise<void>;
  cancelBleUpdate(req: BleUpdateSessionRequest): Promise<void>;
};

/**
 * Phases named to match S103 § Implementazione point 1's vocabulary
 * (arm/upload/progress/finalize/reboot/trial/confirm/rollback/cancel).
 * `TRIAL`/`CONFIRMED`/`ROLLED_BACK` are never reached by this class —
 * `spaghetti_update_confirm_trial()` is Core-only, never exposed to any
 * transport (`update.h`), and rollback is MCUboot-automatic — both are only
 * ever *observed*, post-reboot, by `postflight.ts`'s snapshot comparison
 * against a fresh connection. This session object's own lifecycle ends at
 * `PENDING_REBOOT`, `CANCELLED` or `FAILED`.
 */
export const OtaSessionPhase = {
  ARM: "ARM",
  UPLOAD: "UPLOAD",
  FINALIZE: "FINALIZE",
  PENDING_REBOOT: "PENDING_REBOOT",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
} as const;

export type OtaSessionPhaseKind = (typeof OtaSessionPhase)[keyof typeof OtaSessionPhase];

export type OtaSessionOutcome = { readonly ok: true } | { readonly ok: false; readonly issue: DomainError };

function invalidTransition(from: OtaSessionPhaseKind, action: string): OtaSessionOutcome {
  return {
    ok: false,
    issue: domainError({
      code: OtaLifecycleErrorCode.INVALID_TRANSITION,
      path: ["ota-lifecycle", "ble-ota-session"],
      target: action,
      remediation: `Cannot ${action} from phase ${from}.`,
    }),
  };
}

function remoteError(action: string, cause: unknown): DomainError {
  return domainError({ code: OtaLifecycleErrorCode.REMOTE_ERROR, path: ["ota-lifecycle", "ble-ota-session"], target: action, remediation: `${action} failed on the wire — check the connection and retry.`, cause });
}

/**
 * Orchestrates one `OPEN_BLE_UPDATE` -> `WRITE_BLE_UPDATE`* -> `FINISH_BLE_UPDATE`
 * (or `CANCEL_BLE_UPDATE`) sequence, the only OTA transport fully modeled on
 * Protocol V1's CBOR envelope (Wi-Fi/`OPEN_WIFI_UPDATE` only returns a
 * handover address/port; the actual bytes travel a raw UDP channel this SDK
 * does not model). Enforces the real firmware contiguity rule locally
 * before spending a wire call on a write that would fail anyway
 * (`spaghetti_update_write()`: "chunks must be contiguous", `update.h`).
 */
export class BleOtaSession {
  private phase: OtaSessionPhaseKind = OtaSessionPhase.ARM;
  private sessionId: number | undefined;
  private nextExpectedOffset = 0;

  constructor(
    private readonly client: BleOtaWireClient,
    private readonly candidate: OtaCandidateManifest,
    private readonly preflight: PreflightResult,
  ) {}

  get currentPhase(): OtaSessionPhaseKind {
    return this.phase;
  }

  /**
   * Refuses to open a wire session at all unless `preflight.kind === READY`
   * — S103 § Verifiche: "la rimozione di una feature in uso è rifiutata
   * prima di avviare l'OTA" holds architecturally here, not only inside
   * `@spaghettilab/ota-preflight`'s own `preflightOtaCandidate()` (S102):
   * this class has no code path that can reach `openBleUpdate` with a
   * non-`READY` preflight result.
   */
  async arm(imageSha256: Uint8Array): Promise<OtaSessionOutcome> {
    if (this.preflight.kind !== PreflightOutcome.READY) {
      this.phase = OtaSessionPhase.FAILED;
      return {
        ok: false,
        issue: domainError({
          code: OtaLifecycleErrorCode.PREFLIGHT_REJECTED,
          path: ["ota-lifecycle", "ble-ota-session"],
          target: this.preflight.kind,
          remediation: `Preflight rejected this candidate (${this.preflight.reason}) — arm() refuses to open a wire session for a candidate that failed preflight.`,
        }),
      };
    }
    if (this.phase !== OtaSessionPhase.ARM) return invalidTransition(this.phase, "arm");
    try {
      const opened = await this.client.openBleUpdate({ imageSize: this.candidate.artifact.sizeBytes, imageSha256, version: this.candidate.fwVersion });
      this.sessionId = opened.sessionId;
      this.phase = OtaSessionPhase.UPLOAD;
      return { ok: true };
    } catch (cause) {
      this.phase = OtaSessionPhase.FAILED;
      return { ok: false, issue: remoteError("arm", cause) };
    }
  }

  /** `last: true` moves the session to `FINALIZE`-ready without itself calling `FINISH_BLE_UPDATE` — call `finalize()` next. */
  async writeChunk(offset: number, bytes: Uint8Array, last: boolean): Promise<OtaSessionOutcome> {
    if (this.phase !== OtaSessionPhase.UPLOAD || this.sessionId === undefined) return invalidTransition(this.phase, "writeChunk");
    if (offset !== this.nextExpectedOffset) {
      return {
        ok: false,
        issue: domainError({
          code: OtaLifecycleErrorCode.OUT_OF_ORDER_WRITE,
          path: ["ota-lifecycle", "ble-ota-session"],
          target: `offset ${offset}`,
          remediation: `spaghetti_update_write() requires contiguous chunks — expected offset ${this.nextExpectedOffset}, refusing before wasting a wire call.`,
        }),
      };
    }
    try {
      await this.client.writeBleUpdate({ sessionId: this.sessionId, offset, bytes });
      this.nextExpectedOffset += bytes.length;
      if (last) this.phase = OtaSessionPhase.FINALIZE;
      return { ok: true };
    } catch (cause) {
      this.phase = OtaSessionPhase.FAILED;
      return { ok: false, issue: remoteError("writeChunk", cause) };
    }
  }

  async finalize(): Promise<OtaSessionOutcome> {
    if (this.phase !== OtaSessionPhase.FINALIZE || this.sessionId === undefined) return invalidTransition(this.phase, "finalize");
    try {
      await this.client.finishBleUpdate({ sessionId: this.sessionId });
      this.phase = OtaSessionPhase.PENDING_REBOOT;
      return { ok: true };
    } catch (cause) {
      this.phase = OtaSessionPhase.FAILED;
      return { ok: false, issue: remoteError("finalize", cause) };
    }
  }

  /** Valid any time before the device has actually rebooted — mirrors `spaghetti_update_cancel()`, which only refuses (`-EPERM`) once the running image is `TRIAL_BOOT` (i.e., after reboot, a state this class never observes itself — see `postflight.ts`). */
  async cancel(): Promise<OtaSessionOutcome> {
    if (this.phase === OtaSessionPhase.CANCELLED || this.phase === OtaSessionPhase.FAILED) return invalidTransition(this.phase, "cancel");
    if (this.sessionId === undefined) {
      this.phase = OtaSessionPhase.CANCELLED;
      return { ok: true };
    }
    try {
      await this.client.cancelBleUpdate({ sessionId: this.sessionId });
      this.phase = OtaSessionPhase.CANCELLED;
      return { ok: true };
    } catch (cause) {
      this.phase = OtaSessionPhase.FAILED;
      return { ok: false, issue: remoteError("cancel", cause) };
    }
  }
}

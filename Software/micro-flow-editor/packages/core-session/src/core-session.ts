import { canonicalProjectHash, type CoreBindingRecord, type DeploymentRecordV1, type ProjectV1 } from "@spaghettilab/domain";
import type {
  EventStream,
  GetCapabilitiesResponse,
  GetCatalogResponse,
  GetConfigResponse,
  GetFeaturesResponse,
  GetResourcesResponse,
  GetStatusResponse,
  GetTopologyResponse,
  SpaghettiClient,
} from "@spaghettilab/protocol-sdk";
import { CatalogCache } from "./catalog-cache.js";
import { CoreSessionError, CoreSessionErrorCode } from "./errors.js";
import { bytesEqualHex, bytesToHex } from "./hex.js";
import type { SessionState, SyncRelationship } from "./session-state.js";
import { classifySyncRelationship } from "./sync-classifier.js";

export type CoreSessionSnapshot = {
  readonly status?: GetStatusResponse;
  readonly capabilities?: GetCapabilitiesResponse;
  readonly features?: GetFeaturesResponse;
  readonly catalog?: GetCatalogResponse;
  readonly topology?: GetTopologyResponse;
  readonly config?: GetConfigResponse;
  readonly resources?: GetResourcesResponse;
};

/**
 * Owns connection and synchronization for one Core (`REACT_FLOW_ARCHITECTURE.md`
 * § Device Session Manager). Drives the session state machine, reads
 * identity/status/capability/features/catalog/topology/Config/resources in
 * coherent order on sync (S030 point 3), and classifies the project/device
 * relationship — but never writes to either automatically (S030 point 6:
 * "mai auto-apply al reconnect").
 */
export class CoreSession {
  private _state: SessionState = "DISCONNECTED";
  private _stale = false;
  private deviceId: Uint8Array | null = null;
  private bootId: bigint | null = null;
  private disposed = false;
  private snapshot: CoreSessionSnapshot = {};
  private _syncRelationship: SyncRelationship | null = null;
  private readonly eventLoop: Promise<void>;

  constructor(
    readonly binding: CoreBindingRecord,
    private readonly client: SpaghettiClient,
    private readonly eventStream: EventStream,
    private readonly catalogCache: CatalogCache,
  ) {
    this.eventLoop = this.consumeEvents();
  }

  get state(): SessionState {
    return this._state;
  }

  /** True once this session was `READY` at least once and has since gone `DISCONNECTED` — the "Core offline resta editabile con ultimo snapshot marcato stale" case (S030 § Verifiche). */
  get stale(): boolean {
    return this._stale;
  }

  /** Last known good data, retained across disconnects — never cleared by `disconnect()`. */
  get lastKnownSnapshot(): CoreSessionSnapshot {
    return this.snapshot;
  }

  get syncRelationship(): SyncRelationship | null {
    return this._syncRelationship;
  }

  private async consumeEvents(): Promise<void> {
    try {
      for await (const event of this.eventStream) {
        if (this.disposed) return;
        if (event.kind !== "status") continue;
        this.deviceId = event.payload.deviceId;
        const rebooted = this.bootId !== null && event.payload.bootId !== this.bootId;
        this.bootId = event.payload.bootId;
        if (rebooted && this._state === "READY") {
          // A changed boot ID invalidates only the ephemeral "we know this is
          // current" guarantee — the last known snapshot stays in place, and
          // catalog cache invalidation (if the fingerprint actually changed)
          // happens inside sync() on the next read, not here (S030 point 7:
          // "reconnect e reboot invalidano soltanto stato effimero necessario").
          this._state = "SYNCHRONIZING";
        }
      }
    } catch {
      // Stream disposed or the transport is gone — nothing more to consume.
    }
  }

  /**
   * Connects and reads the Core's state in the order S030 point 3 specifies.
   * Never touches the project or the device's Config — this is read-only.
   */
  async connect(): Promise<void> {
    this._state = "CONNECTING";
    // No separate handshake is exposed at this layer — transport-level
    // authentication (TLS, connection profile credentials) happens below
    // SpaghettiClient (S022/S023); this state exists for UI/observability
    // continuity with the architecture's own state diagram.
    this._state = "AUTHENTICATING";
    this._state = "SYNCHRONIZING";
    try {
      const [status, capabilities, features] = await Promise.all([
        this.client.getStatus(),
        this.client.getCapabilities(),
        this.client.getFeatures(),
      ]);

      if (this.deviceId !== null && !bytesEqualHex(this.deviceId, this.binding.expectedDeviceId)) {
        this._state = "ERROR";
        throw new CoreSessionError(
          CoreSessionErrorCode.DEVICE_ID_MISMATCH,
          `expected device ${this.binding.expectedDeviceId}, connected device reports ${bytesToHex(this.deviceId)}`,
        );
      }

      const catalog = await this.readCatalog();
      const topology = await this.client.getFullTopology().then((flows) => ({ flows, nextCursor: 0 }));
      const config = await this.client.getConfig();
      const resources = await this.client.getResources();

      this.snapshot = { status, capabilities, features, catalog, topology, config, resources };
      this._state = "READY";
      this._stale = false;
    } catch (cause) {
      if (this._state !== "ERROR") this._state = "ERROR";
      throw cause;
    }
  }

  /**
   * Reads the catalog via a cheap first page (to learn the current
   * fingerprint), reusing the cache on a hit and only paginating the rest
   * (S022's `getFullCatalog()`, which already restarts on a fingerprint
   * change mid-read — S030's own "fingerprint a metà paginazione non
   * pubblica catalogo parziale" requirement) on a miss.
   */
  private async readCatalog(): Promise<GetCatalogResponse> {
    const firstPage = await this.client.getCatalog({ cursor: 0, limit: 1 });
    if (this.deviceId) {
      const cached = this.catalogCache.get(this.deviceId, firstPage.fingerprint);
      if (cached) return cached;
    }
    const full = await this.client.getFullCatalog();
    if (this.deviceId) {
      this.catalogCache.invalidateDevice(this.deviceId);
      this.catalogCache.set(this.deviceId, full);
    }
    return full;
  }

  /**
   * Classifies the project/device relationship against the last snapshot
   * read by `connect()`. `catalogCompatible` is supplied by the caller — see
   * `sync-classifier.ts`'s doc comment on why this package doesn't resolve
   * it itself (S042, not yet built).
   */
  syncWithProject(project: ProjectV1, catalogCompatible: boolean): SyncRelationship {
    if (!this.snapshot.config) {
      throw new Error("CoreSession.syncWithProject: call connect() first, no Config snapshot available yet");
    }
    const lastDeployment = this.latestDeploymentRecord(project);
    const relationship = classifySyncRelationship({
      lastDeployment,
      currentProjectHash: canonicalProjectHash(project),
      liveConfigHash: bytesToHex(this.snapshot.config.sha256),
      catalogCompatible,
    });
    this._syncRelationship = relationship;
    return relationship;
  }

  private latestDeploymentRecord(project: ProjectV1): DeploymentRecordV1 | null {
    const records = project.deploymentRecords.filter((r) => r.target === this.binding.bindingId);
    if (records.length === 0) return null;
    return records.reduce((latest, r) => (r.timestamp > latest.timestamp ? r : latest));
  }

  /** Marks the session offline. The last known snapshot is deliberately never cleared — it stays editable while stale (S030 § Verifiche). */
  disconnect(): void {
    if (this._state === "READY" || this._state === "SYNCHRONIZING") {
      this._stale = true;
    }
    this._state = "DISCONNECTED";
  }

  /** Explicit action: adopt the device's live Config as-is. Never called automatically. */
  importLiveState(): GetConfigResponse {
    if (!this.snapshot.config) {
      throw new Error("CoreSession.importLiveState: no live Config snapshot available — call connect() first");
    }
    return this.snapshot.config;
  }

  /** Explicit action: keep the project's local state, ignore what the device reports this session. Deliberately a no-op — its only purpose is to be the caller's explicit choice, distinct from silence. */
  keepProject(): void {
    // No-op by design.
  }

  /** Explicit action: structured reconciliation — not implemented yet, it needs the Config decompiler (S073). */
  reconcile(): never {
    throw new CoreSessionError(
      CoreSessionErrorCode.RECONCILE_NOT_IMPLEMENTED,
      "structured reconcile requires the Config decompiler (S073), not yet implemented — use importLiveState() or keepProject() explicitly instead",
    );
  }

  dispose(): void {
    this.disposed = true;
    this.eventStream.dispose();
    void this.eventLoop;
  }
}

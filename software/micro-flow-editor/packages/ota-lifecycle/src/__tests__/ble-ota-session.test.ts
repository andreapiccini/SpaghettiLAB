import { describe, expect, it, vi } from "vitest";
import { PreflightOutcome, type PreflightResult } from "@spaghettilab/ota-preflight";
import { BleOtaSession, OtaSessionPhase, type BleOtaWireClient } from "../ble-ota-session.js";
import { candidateFixture } from "./fixtures.js";

const READY: PreflightResult = { kind: PreflightOutcome.READY, reason: "ok" };
const REJECTED: PreflightResult = { kind: PreflightOutcome.REJECTED_BUDGET_EXCEEDED, reason: "too big" };

function clientFixture(overrides: Partial<BleOtaWireClient> = {}): BleOtaWireClient {
  return {
    openBleUpdate: vi.fn().mockResolvedValue({ sessionId: 1 }),
    writeBleUpdate: vi.fn().mockResolvedValue(undefined),
    finishBleUpdate: vi.fn().mockResolvedValue(undefined),
    cancelBleUpdate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("BleOtaSession — S103 § Verifiche", () => {
  it("refuses to open a wire session at all when preflight did not pass", async () => {
    const client = clientFixture();
    const session = new BleOtaSession(client, candidateFixture(), REJECTED);
    const result = await session.arm(new Uint8Array(32));
    expect(result.ok).toBe(false);
    expect(client.openBleUpdate).not.toHaveBeenCalled();
    expect(session.currentPhase).toBe(OtaSessionPhase.FAILED);
  });

  it("runs arm -> writeChunk -> finalize to PENDING_REBOOT on the happy path", async () => {
    const client = clientFixture();
    const session = new BleOtaSession(client, candidateFixture(), READY);
    expect((await session.arm(new Uint8Array(32))).ok).toBe(true);
    expect((await session.writeChunk(0, new Uint8Array(100), false)).ok).toBe(true);
    expect((await session.writeChunk(100, new Uint8Array(50), true)).ok).toBe(true);
    expect(session.currentPhase).toBe(OtaSessionPhase.FINALIZE);
    expect((await session.finalize()).ok).toBe(true);
    expect(session.currentPhase).toBe(OtaSessionPhase.PENDING_REBOOT);
  });

  it("refuses an out-of-order write before wasting a wire call — contiguity is a local, pre-wire check", async () => {
    const client = clientFixture();
    const session = new BleOtaSession(client, candidateFixture(), READY);
    await session.arm(new Uint8Array(32));
    const result = await session.writeChunk(50, new Uint8Array(10), false);
    expect(result.ok).toBe(false);
    expect(client.writeBleUpdate).not.toHaveBeenCalled();
  });

  it("moves to FAILED, never PENDING_REBOOT, when a wire write fails mid-upload (simulated disconnect)", async () => {
    const client = clientFixture({ writeBleUpdate: vi.fn().mockRejectedValue(new Error("disconnected")) });
    const session = new BleOtaSession(client, candidateFixture(), READY);
    await session.arm(new Uint8Array(32));
    const result = await session.writeChunk(0, new Uint8Array(10), false);
    expect(result.ok).toBe(false);
    expect(session.currentPhase).toBe(OtaSessionPhase.FAILED);
  });

  it("moves to FAILED, never PENDING_REBOOT, when finalize fails (simulated hash mismatch at finish)", async () => {
    const client = clientFixture({ finishBleUpdate: vi.fn().mockRejectedValue(new Error("bad image header")) });
    const session = new BleOtaSession(client, candidateFixture(), READY);
    await session.arm(new Uint8Array(32));
    await session.writeChunk(0, new Uint8Array(10), true);
    const result = await session.finalize();
    expect(result.ok).toBe(false);
    expect(session.currentPhase).toBe(OtaSessionPhase.FAILED);
  });

  it("can cancel before reboot (ARM/UPLOAD/FINALIZE/PENDING_REBOOT), calling CANCEL_BLE_UPDATE", async () => {
    const client = clientFixture();
    const session = new BleOtaSession(client, candidateFixture(), READY);
    await session.arm(new Uint8Array(32));
    const result = await session.cancel();
    expect(result.ok).toBe(true);
    expect(client.cancelBleUpdate).toHaveBeenCalledWith({ sessionId: 1 });
    expect(session.currentPhase).toBe(OtaSessionPhase.CANCELLED);
  });

  it("refuses to cancel twice", async () => {
    const client = clientFixture();
    const session = new BleOtaSession(client, candidateFixture(), READY);
    await session.arm(new Uint8Array(32));
    await session.cancel();
    const result = await session.cancel();
    expect(result.ok).toBe(false);
  });
});

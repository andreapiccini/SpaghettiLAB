import { describe, expect, it } from "vitest";
import type { GetStatusResponse } from "@spaghettilab/protocol-sdk";
import { describeConnectivityStatus, describeCoreStatus, watchdogInferenceOf } from "../status-view.js";

function statusFixture(overrides: Partial<GetStatusResponse> = {}): GetStatusResponse {
  return {
    state: 3,
    mode: 1,
    imageState: 0,
    activeSlot: 0,
    imageConfirmed: true,
    version: "1.2.3",
    portCount: 4,
    lastResetCause: 0x20,
    healthState: 1,
    modules: [{ key: 1, id: 42, portId: 2, state: 1, endpointKind: 1, endpointValueRaw: 0x37, typeId: "sensor.temp" }],
    ...overrides,
  };
}

describe("describeCoreStatus", () => {
  it("labels every enum-shaped field with its real firmware name", () => {
    const view = describeCoreStatus(statusFixture());
    expect(view.state).toBe("RUNNING");
    expect(view.mode).toBe("NORMAL");
    expect(view.imageState).toBe("CONFIRMED");
    expect(view.healthState).toBe("HEALTHY");
    expect(view.watchdog).toBe("armed");
    expect(view.modules).toEqual([{ key: 1, id: 42, portId: 2, state: "READY", endpointKind: "I2C_ADDRESS", typeId: "sensor.temp" }]);
  });

  it("falls back to UNKNOWN(n) for an unrecognized enum value instead of throwing", () => {
    const view = describeCoreStatus(statusFixture({ state: 99 }));
    expect(view.state).toBe("UNKNOWN(99)");
  });

  it("keeps lastResetCause as a raw, undecoded bitmask", () => {
    const view = describeCoreStatus(statusFixture({ lastResetCause: 0x20 }));
    expect(view.lastResetCauseRaw).toBe(0x20);
  });
});

describe("watchdogInferenceOf — HealthState.HEALTHY/DEGRADED are the only wire-visible signal", () => {
  it("HEALTHY (1) means the hardware watchdog is armed", () => {
    expect(watchdogInferenceOf(1)).toBe("armed");
  });
  it("DEGRADED (2) means no hardware watchdog", () => {
    expect(watchdogInferenceOf(2)).toBe("not-armed");
  });
  it("STARTING/STALE cannot tell either way", () => {
    expect(watchdogInferenceOf(0)).toBe("unknown");
    expect(watchdogInferenceOf(3)).toBe("unknown");
  });
});

describe("describeConnectivityStatus", () => {
  it("derives hasActiveLease from a positive leaseExpiresAtMs", () => {
    const view = describeConnectivityStatus({ policy: 1, activeServices: 1, leasedServices: 0, leaseExpiresAtMs: 1000n, lastError: 0n });
    expect(view.hasActiveLease).toBe(true);
  });
  it("no active lease when leaseExpiresAtMs is zero", () => {
    const view = describeConnectivityStatus({ policy: 1, activeServices: 1, leasedServices: 0, leaseExpiresAtMs: 0n, lastError: 0n });
    expect(view.hasActiveLease).toBe(false);
  });
});

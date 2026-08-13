import { describe, expect, it } from "vitest";
import type { GetCapabilitiesResponse, GetResourcesResponse } from "@spaghettilab/protocol-sdk";
import { describeResourceMonitor, highWaterRegressed } from "../resource-monitor.js";

function resourcesFixture(overrides: Partial<GetResourcesResponse> = {}): GetResourcesResponse {
  const pool = { capacity: 10, used: 3, peak: 5 };
  return {
    featureSetHash: new Uint8Array([1, 2, 3]),
    modules: pool,
    rules: pool,
    blocks: pool,
    profiles: pool,
    records: pool,
    workspace: pool,
    allocationFailures: 0,
    flashSlotBytes: 1048576,
    flashImageBudgetBytes: 786432,
    flashHeadroomBytes: 262144,
    staticRamBudgetBytes: 65536,
    ...overrides,
  };
}

const capabilities: GetCapabilitiesResponse = {
  resourceProfile: 1,
  buildCapabilities: 0,
  coreVariant: "core-a",
  maxProtocolPayload: 2048,
  maxInflightRequests: 4,
  replayWindowMs: 5000,
  maxModules: 32,
  maxPrincipals: 4,
};

describe("describeResourceMonitor — S093 § Verifiche", () => {
  it("keeps every pool distinct — never sums them into one number", () => {
    const view = describeResourceMonitor(resourcesFixture(), capabilities);
    expect(view.pools.modules).toEqual({ capacity: 10, used: 3, peak: 5 });
    expect(view.pools.rules).toEqual({ capacity: 10, used: 3, peak: 5 });
    expect(Object.keys(view.pools)).toEqual(["modules", "rules", "blocks", "profiles", "records", "workspace"]);
  });

  it("surfaces flash/static RAM as distinct real numbers, never summed with the pools", () => {
    const view = describeResourceMonitor(resourcesFixture(), capabilities);
    expect(view.flashAndStaticRam).toEqual({
      flashSlotBytes: 1048576,
      flashImageBudgetBytes: 786432,
      flashHeadroomBytes: 262144,
      staticRamBudgetBytes: 65536,
    });
  });

  it("a past allocation failure stays visible (hasEverFailed true) even with allocationFailures representing a sticky count", () => {
    const view = describeResourceMonitor(resourcesFixture({ allocationFailures: 2 }), capabilities);
    expect(view.allocationFailures.count).toBe(2);
    expect(view.allocationFailures.hasEverFailed).toBe(true);
  });

  it("no allocation failure ever recorded reports hasEverFailed false", () => {
    const view = describeResourceMonitor(resourcesFixture({ allocationFailures: 0 }), capabilities);
    expect(view.allocationFailures.hasEverFailed).toBe(false);
  });

  it("surfaces Config limits (maxModules/maxPrincipals) from GET_CAPABILITIES", () => {
    const view = describeResourceMonitor(resourcesFixture(), capabilities);
    expect(view.configLimits).toEqual({ maxModules: 32, maxPrincipals: 4 });
  });
});

describe("highWaterRegressed", () => {
  it("false when peak only increases or stays the same", () => {
    expect(highWaterRegressed(5, 5)).toBe(false);
    expect(highWaterRegressed(5, 8)).toBe(false);
  });
  it("true when peak goes backwards, which should never happen without an explicit reset", () => {
    expect(highWaterRegressed(8, 5)).toBe(true);
  });
});

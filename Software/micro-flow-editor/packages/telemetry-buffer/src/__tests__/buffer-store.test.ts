import { describe, expect, it } from "vitest";
import { TelemetryBufferStore } from "../buffer-store.js";

describe("TelemetryBufferStore", () => {
  it("drops the oldest entry on overflow and reports the drop count, never growing unbounded", () => {
    const store = new TelemetryBufferStore({ capacityPerBuffer: 2 });
    for (let i = 1; i <= 5; i++) {
      store.pushDecoded("core-a", "schema.a", { 1: BigInt(i) }, { sourceKey: 1, schemaVersion: 1, bootEpoch: 0, sequence: i });
    }
    const exported = store.export("core-a", "schema.a");
    expect(exported.entries).toHaveLength(2);
    expect(exported.droppedCount).toBe(3);
    // Oldest dropped first — the two remaining entries are sequence 4 and 5.
    expect(exported.entries.map((e) => e.record.provenance.sequence)).toEqual([4, 5]);
  });

  it("keeps an independent gap log per Core, included in every export for that Core", () => {
    const store = new TelemetryBufferStore();
    store.observeBootId("core-a", 1n);
    store.observeBootId("core-a", 2n);
    store.recordSequenceGap("core-a", "expected 3 got 5");
    store.pushDecoded("core-a", "schema.a", {}, { sourceKey: 1, schemaVersion: 1, bootEpoch: 1, sequence: 1 });

    const exported = store.export("core-a", "schema.a");
    expect(exported.gaps).toHaveLength(2);
    expect(exported.gaps.map((g) => g.reason)).toEqual(["boot_id_changed", "sequence_discontinuity"]);
  });

  it("bootEpochOf/lastBootIdOf start unset, never a fabricated default", () => {
    const store = new TelemetryBufferStore();
    expect(store.bootEpochOf("core-a")).toBe(0);
    expect(store.lastBootIdOf("core-a")).toBeUndefined();
  });
});

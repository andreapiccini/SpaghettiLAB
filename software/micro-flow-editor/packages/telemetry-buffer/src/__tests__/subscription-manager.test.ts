import { EventStream, FakeTransport, fakeRecordEvent, fakeStatusEvent } from "@spaghettilab/protocol-sdk";
import { describe, expect, it } from "vitest";
import { TelemetryBufferStore } from "../buffer-store.js";
import { subscribeCore } from "../subscription-manager.js";

async function flush(times = 20): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

describe("subscribeCore + TelemetryBufferStore — S091 § Verifiche", () => {
  it("records from two distinct Cores/schemas never contaminate the same buffer", async () => {
    const store = new TelemetryBufferStore();
    const transportA = new FakeTransport();
    const transportB = new FakeTransport();
    const streamA = new EventStream(transportA);
    const streamB = new EventStream(transportB);

    void subscribeCore(store, "core-a", streamA, { resolveFields: () => ({ 1: 100n }) });
    void subscribeCore(store, "core-b", streamB, { resolveFields: () => ({ 1: 200n }) });

    transportA.deliverEvent(fakeRecordEvent(1, 1, "schema.a"));
    transportB.deliverEvent(fakeRecordEvent(1, 1, "schema.a"));
    await flush();

    const a = store.getEntries("core-a", "schema.a");
    const b = store.getEntries("core-b", "schema.a");
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0]!.record.kind).toBe("decoded");
    expect((a[0]!.record as { fields: Record<number, unknown> }).fields[1]).toBe(100n);
    expect((b[0]!.record as { fields: Record<number, unknown> }).fields[1]).toBe(200n);

    streamA.dispose();
    streamB.dispose();
  });

  it("a reboot with a changed boot ID makes the gap visible and never joins incompatible series silently", async () => {
    const store = new TelemetryBufferStore();
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    void subscribeCore(store, "core-a", stream, { resolveFields: () => ({ 1: 1n }) });

    transport.deliverEvent(fakeStatusEvent(1, 1n));
    transport.deliverEvent(fakeRecordEvent(1, 1, "schema.a"));
    await flush();
    expect(store.bootEpochOf("core-a")).toBe(0);

    transport.deliverEvent(fakeStatusEvent(2, 2n));
    await flush();
    transport.deliverEvent(fakeRecordEvent(1, 1, "schema.a"));
    await flush();

    expect(store.bootEpochOf("core-a")).toBe(1);
    const gaps = store.getGaps("core-a");
    expect(gaps.some((g) => g.reason === "boot_id_changed")).toBe(true);

    const entries = store.getEntries("core-a", "schema.a");
    expect(entries).toHaveLength(2);
    expect(entries[0]!.record.provenance.bootEpoch).toBe(0);
    expect(entries[1]!.record.provenance.bootEpoch).toBe(1);

    stream.dispose();
  });

  it("an unknown schema preserves the raw payload instead of discarding or guessing at it", async () => {
    const store = new TelemetryBufferStore();
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    const raw = new Uint8Array([1, 2, 3]);
    void subscribeCore(store, "core-a", stream, {
      resolveFields: () => undefined,
      resolveRawPayload: () => raw,
    });

    transport.deliverEvent(fakeRecordEvent(1, 1, "schema.unknown"));
    await flush();

    const entries = store.getEntries("core-a", "schema.unknown");
    expect(entries).toHaveLength(1);
    expect(entries[0]!.record.kind).toBe("unknown-schema");
    if (entries[0]!.record.kind === "unknown-schema") {
      expect(entries[0]!.record.needsCatalogRefresh).toBe(true);
      expect(entries[0]!.record.rawPayload).toEqual(raw);
    }

    stream.dispose();
  });
});

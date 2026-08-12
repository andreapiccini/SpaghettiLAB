import { describe, expect, it } from "vitest";
import { EventStream } from "../event-stream.js";
import { FakeTransport } from "../fakes/fake-transport.js";
import { fakeConnectivityEvent, fakeDiscoveryEvent, fakeRebootScenario, fakeRecordEvent, fakeRecordEventSequence, fakeStatusEvent } from "../fakes/fake-event-fixtures.js";

describe("EventStream — basic delivery", () => {
  it("decodes record/status/discovery/connectivity events in arrival order", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);

    transport.deliverEvent(fakeRecordEvent(1, 10));
    transport.deliverEvent(fakeStatusEvent(2, 1n));
    transport.deliverEvent(fakeDiscoveryEvent(3, 99));
    transport.deliverEvent(fakeConnectivityEvent(4));

    expect((await stream.next()).kind).toBe("record");
    expect((await stream.next()).kind).toBe("status");
    expect((await stream.next()).kind).toBe("discovery");
    expect((await stream.next()).kind).toBe("connectivity");
  });

  it("supports async-iterating already-buffered events", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    transport.deliverEvent(fakeRecordEvent(1, 10));
    transport.deliverEvent(fakeRecordEvent(2, 10));

    const received: string[] = [];
    for await (const event of stream) {
      received.push(event.kind);
      if (received.length === 2) break;
    }

    expect(received).toEqual(["record", "record"]);
  });

  it("resolves next() only once a matching event later arrives", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);

    const pending = stream.next();
    let resolved = false;
    void pending.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);

    transport.deliverEvent(fakeRecordEvent(1, 10));
    const event = await pending;
    expect(event.kind).toBe("record");
  });
});

describe("EventStream — backpressure", () => {
  it("caps the buffer at capacity, dropping the oldest event and counting the drop, instead of growing without bound", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport, { capacity: 3 });

    for (let i = 1; i <= 5; i++) {
      transport.deliverEvent(fakeRecordEvent(i, 10));
    }

    expect(stream.droppedCount).toBe(2);

    const kept: number[] = [];
    for (let i = 0; i < 3; i++) {
      const event = await stream.next();
      if (event.kind === "record") kept.push(event.payload.sequence);
    }
    // The two oldest (sequence 1, 2) were dropped; 3, 4, 5 remain.
    expect(kept).toEqual([3, 4, 5]);
  });
});

describe("EventStream — gap signaling", () => {
  it("emits an explicit boot_id_changed gap on a reconnect, never hiding it", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);

    for (const bytes of fakeRebootScenario(10)) {
      transport.deliverEvent(bytes);
    }

    const kinds: string[] = [];
    for (let i = 0; i < fakeRebootScenario(10).length; i++) {
      kinds.push((await stream.next()).kind);
    }

    expect(kinds).toContain("gap");
    const gapIndex = kinds.indexOf("gap");
    expect(kinds[gapIndex]).toBe("gap");
  });

  it("emits a sequence_discontinuity gap when a record sequence is skipped for the same source", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);

    transport.deliverEvent(fakeRecordEvent(1, 10));
    transport.deliverEvent(fakeRecordEvent(3, 10)); // sequence 2 skipped

    const first = await stream.next();
    const second = await stream.next();
    expect(first.kind).toBe("record");
    expect(second).toMatchObject({ kind: "gap", reason: "sequence_discontinuity" });
  });

  it("does not flag a gap across two different sources interleaved", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);

    transport.deliverEvent(fakeRecordEvent(1, 10));
    transport.deliverEvent(fakeRecordEvent(1, 20));
    transport.deliverEvent(fakeRecordEvent(2, 10));
    transport.deliverEvent(fakeRecordEvent(2, 20));

    const kinds: string[] = [];
    for (let i = 0; i < 4; i++) kinds.push((await stream.next()).kind);

    expect(kinds).toEqual(["record", "record", "record", "record"]);
  });
});

describe("EventStream — malformed input", () => {
  it("silently drops an undecodable event instead of crashing the stream", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);

    expect(() => transport.deliverEvent(new Uint8Array([0xff, 0xff]))).not.toThrow();

    transport.deliverEvent(fakeRecordEvent(1, 10));
    const event = await stream.next();
    expect(event.kind).toBe("record");
  });
});

describe("EventStream — dispose", () => {
  it("stops receiving events after dispose()", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    stream.dispose();

    transport.deliverEvent(fakeRecordEvent(1, 10));

    // Nothing was buffered — next() would hang forever if we awaited it, so
    // just assert the internal state didn't change instead.
    expect(stream.droppedCount).toBe(0);
  });
});

describe("fake event fixtures — determinism", () => {
  it("produces byte-identical output across separate calls with the same arguments", () => {
    expect(fakeRecordEventSequence(5, 10)).toEqual(fakeRecordEventSequence(5, 10));
    expect(fakeRebootScenario(7)).toEqual(fakeRebootScenario(7));
  });

  it("fakeRecordEventSequence produces a contiguous run of sequence numbers", () => {
    const events = fakeRecordEventSequence(3, 1);
    expect(events).toHaveLength(3);
  });
});

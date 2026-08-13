import { describe, expect, it } from "vitest";
import { EventStream, fakeRecordEvent, FakeTransport } from "@spaghettilab/protocol-sdk";
import { runRecordSource, type RecordSourceMessage } from "../record-source.js";

async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

describe("runRecordSource — S112 § Verifiche (same S024 fixtures as the React Flow app)", () => {
  it("emits a message for every matching RECORD event delivered via the shared S024 FakeTransport", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    const received: RecordSourceMessage[] = [];

    void runRecordSource(stream, "core-1", { sourceKey: 10 }, (msg) => received.push(msg));

    transport.deliverEvent(fakeRecordEvent(1, 10, "sensor.temp", 1));
    transport.deliverEvent(fakeRecordEvent(2, 10, "sensor.temp", 1));
    await flush();

    expect(received).toHaveLength(2);
    expect(received[0]).toEqual({ sourceKey: 10, sequence: 1, schemaId: "sensor.temp", schemaVersion: 1, fields: undefined });
  });

  it("filters out records from a non-matching sourceKey", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    const received: RecordSourceMessage[] = [];

    void runRecordSource(stream, "core-1", { sourceKey: 10 }, (msg) => received.push(msg));

    transport.deliverEvent(fakeRecordEvent(1, 99));
    await flush();

    expect(received).toHaveLength(0);
  });

  it("calls the caller-supplied resolveFields for each matching record, never inventing field values itself", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    const received: RecordSourceMessage[] = [];

    void runRecordSource(stream, "core-1", {}, (msg) => received.push(msg), async () => ({ 0: 21.5 }));

    transport.deliverEvent(fakeRecordEvent(1, 10, "sensor.temp", 1));
    await flush();

    expect(received[0]?.fields).toEqual({ 0: 21.5 });
  });
});

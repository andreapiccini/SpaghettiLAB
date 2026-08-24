import { describe, expect, it } from "vitest";
import type { BufferedTelemetryEntry } from "../buffer-store.js";
import { TelemetrySinkFanout, type TelemetrySink } from "../sink.js";

const entry = {
  record: {
    kind: "unknown-schema",
    provenance: {
      coreId: "core-a",
      sourceKey: 1,
      schemaId: "temp",
      schemaVersion: 1,
      bootEpoch: 0,
      sequence: 1,
    },
    needsCatalogRefresh: true,
  },
} satisfies BufferedTelemetryEntry;

describe("telemetry sink fanout", () => {
  it("keeps delivering after one managed sink fails", async () => {
    const delivered: string[] = [];
    const failures: string[] = [];
    const sinks: TelemetrySink[] = [
      {
        apiVersion: 1,
        id: "broken",
        append: () => {
          throw new Error("offline");
        },
        recordGap: () => undefined,
      },
      {
        apiVersion: 1,
        id: "healthy",
        append: () => {
          delivered.push("healthy");
        },
        recordGap: () => undefined,
      },
    ];
    const fanout = new TelemetrySinkFanout(sinks, (id) => failures.push(id));
    await fanout.append(entry);
    expect(failures).toEqual(["broken"]);
    expect(delivered).toEqual(["healthy"]);
  });

  it("rejects incompatible and duplicate sinks", () => {
    const sink: TelemetrySink = {
      apiVersion: 1,
      id: "managed",
      append: () => undefined,
      recordGap: () => undefined,
    };
    expect(
      () => new TelemetrySinkFanout([{ ...sink, apiVersion: 2 as 1 }], () => undefined),
    ).toThrow(/Unsupported/);
    expect(() => new TelemetrySinkFanout([sink, sink], () => undefined)).toThrow(
      /already registered/,
    );
  });
});

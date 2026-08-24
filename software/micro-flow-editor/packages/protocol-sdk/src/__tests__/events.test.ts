import { describe, expect, it } from "vitest";
import {
  decodeConnectivityEventPayload,
  decodeDiscoveryEventPayload,
  decodeRecordEventPayload,
  decodeStatusEventPayload,
  encodeConnectivityEventPayload,
  encodeDiscoveryEventPayload,
  encodeRecordEventPayload,
  encodeStatusEventPayload,
  type ConnectivityEventPayload,
  type DiscoveryEventPayload,
  type RecordEventPayload,
  type StatusEventPayload,
} from "../events.js";

describe("event payloads", () => {
  it("round-trips RECORD", () => {
    const p: RecordEventPayload = { sourceKey: 42, sequence: 100, schemaId: "ina219.sample", schemaVersion: 1 };
    expect(decodeRecordEventPayload(encodeRecordEventPayload(p))).toEqual(p);
  });

  it("round-trips STATUS, including uint64 bootId", () => {
    const p: StatusEventPayload = {
      deviceId: new Uint8Array([1, 2, 3, 4]),
      bootId: 18446744073709551615n,
      queueDepth: 3,
      dropCount: 0,
    };
    expect(decodeStatusEventPayload(encodeStatusEventPayload(p))).toEqual(p);
  });

  it("round-trips DISCOVERY", () => {
    const p: DiscoveryEventPayload = { candidateId: 1, portId: 0, generation: 2 };
    expect(decodeDiscoveryEventPayload(encodeDiscoveryEventPayload(p))).toEqual(p);
  });

  it("round-trips CONNECTIVITY, including a negative signed lastError", () => {
    const p: ConnectivityEventPayload = { policy: 1, activeServices: 0b10, lastError: -110n };
    expect(decodeConnectivityEventPayload(encodeConnectivityEventPayload(p))).toEqual(p);
  });
});

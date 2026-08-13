import { compileConfig, encodeConfigCbor, type CompileConfigInput } from "@spaghettilab/config-compiler";
import { describe, expect, it } from "vitest";
import { decodeConfigCbor } from "../decode-config-cbor.js";

const mqtt = { enabled: true, host: "broker.local", port: 1883, baseTopic: "spaghetti", security: 1, credentialId: 3 };
const energy = { bleAvailability: 1, advertisingWindowMs: 100, advertisingPeriodMs: 500 };

function input(): CompileConfigInput {
  return {
    physicalGraph: {
      layer: "physical-composition",
      nodes: [
        {
          layer: "physical-composition",
          id: "m1",
          data: { kind: "module", driverTypeId: "declarative-device", portId: 1, bayId: 100, railId: 1000, electricalMode: "input-only", properties: { "1": 0x40n, "2": "hello", "3": true } },
        },
      ],
      edges: [],
    },
    processingGraph: {
      layer: "device-processing",
      nodes: [
        { layer: "device-processing", id: "s1", data: { kind: "schedule", moduleNodeId: "m1", periodMs: 1000, enabled: true } },
        { layer: "device-processing", id: "b1", data: { kind: "block", blockTypeId: "scale_offset", properties: {} } },
      ],
      edges: [{ layer: "device-processing", id: "e1", source: "s1", target: "b1", sourceHandle: "1", targetHandle: "0" }],
    },
    mqtt,
    connectivity: 2,
    energy,
  };
}

describe("decodeConfigCbor — the exact inverse of encodeConfigCbor", () => {
  it("round-trips a compiled Config through encode -> decode with no loss", () => {
    const compiled = compileConfig(input());
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    const bytes = encodeConfigCbor(compiled.value);
    const decoded = decodeConfigCbor(bytes);
    expect(decoded).toEqual({ ok: true, value: compiled.value });
  });

  it("rejects a wire version other than 4", () => {
    const compiled = compileConfig(input());
    if (!compiled.ok) throw new Error("fixture must compile");
    const bytes = encodeConfigCbor(compiled.value);
    const tampered = new Uint8Array(bytes);
    tampered[2] = 5; // the WIRE field's single-byte uint value (must stay 0-23 to remain valid CBOR)
    const result = decodeConfigCbor(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("config-decompiler.unsupported_wire_version");
  });

  it("rejects malformed CBOR with a structured error, not a thrown exception", () => {
    const result = decodeConfigCbor(new Uint8Array([0xff, 0xff]));
    expect(result.ok).toBe(false);
  });
});

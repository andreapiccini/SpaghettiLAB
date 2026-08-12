import { describe, expect, it } from "vitest";
import { buildEditorModel } from "../editor-model.js";
import { isPlaceholderDiagnostic, resolveNodeType } from "../placeholder.js";

describe("resolveNodeType", () => {
  it("returns the real node type when the catalog knows it", () => {
    const model = buildEditorModel({ fingerprint: new Uint8Array(0), moduleDrivers: [{ typeId: "relay", commandCount: 1 }], complete: true }, { profiles: [], complete: true });
    const resolved = resolveNodeType("relay", model, { some: "saved-data" });
    expect(isPlaceholderDiagnostic(resolved)).toBe(false);
  });

  it("returns a placeholder that preserves the raw data and offers remediation, never dropping the node", () => {
    const model = buildEditorModel({ fingerprint: new Uint8Array(0), moduleDrivers: [], complete: true }, { profiles: [], complete: true });
    const rawData = { savedProperty: "value-that-must-survive" };

    const resolved = resolveNodeType("unknown-sensor", model, rawData);

    expect(isPlaceholderDiagnostic(resolved)).toBe(true);
    if (!isPlaceholderDiagnostic(resolved)) return;
    expect(resolved.typeId).toBe("unknown-sensor");
    expect(resolved.rawData).toBe(rawData);
    expect(resolved.remediation).toMatch(/Capability Pack|Device Profile/);
  });
});

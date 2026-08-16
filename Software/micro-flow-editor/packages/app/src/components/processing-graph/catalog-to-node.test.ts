import { describe, expect, it } from "vitest";
import { commentAfterCatalogChange } from "./catalog-to-node.js";

describe("commentAfterCatalogChange", () => {
  it("follows the new catalog label when the name was still the previous type", () => {
    expect(commentAfterCatalogChange("System Reboot", "System Reboot", "Bitwise")).toBe("Bitwise");
  });

  it("keeps a custom name", () => {
    expect(commentAfterCatalogChange("reboot sala", "System Reboot", "Bitwise")).toBe("reboot sala");
  });
});

import { describe, expect, it } from "vitest";
import { parseW1RomHex, W1_ROM_BYTE_LENGTH } from "../w1-rom.js";

describe("parseW1RomHex", () => {
  it("accepts 8 bytes as 16 hex chars, optional separators, and canonicalizes to lowercase", () => {
    expect(parseW1RomHex("28FF641F0000003D")).toBe("28ff641f0000003d");
    expect(parseW1RomHex("28:FF:64:1F:00:00:00:3D")).toBe("28ff641f0000003d");
    expect(parseW1RomHex("28 FF 64 1F 00 00 00 3D")).toBe("28ff641f0000003d");
    expect(W1_ROM_BYTE_LENGTH).toBe(8);
  });

  it("rejects a length other than 8 bytes, or non-hex", () => {
    expect(parseW1RomHex("28FF")).toBeUndefined();
    expect(parseW1RomHex("28FF641F0000003DFF")).toBeUndefined();
    expect(parseW1RomHex("28FF641F0000003G")).toBeUndefined();
    expect(parseW1RomHex("")).toBeUndefined();
  });
});

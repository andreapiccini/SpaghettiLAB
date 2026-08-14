/**
 * 1-Wire ROM is instance Config (`SPAGHETTI_DECLARATIVE_CONFIG_W1_ROM`), not
 * a Device Profile field — firmware stores exactly
 * `SPAGHETTI_ENDPOINT_VALUE_MAX` (8) bytes (`module.h`).
 */
export const W1_ROM_BYTE_LENGTH = 8;

const HEX_PAIR = W1_ROM_BYTE_LENGTH * 2;

/**
 * Canonical form: 16 lowercase hex chars, no separators. Accepts spaces,
 * colons, dots, and dashes (e.g. `28:FF:64:1F:00:00:00:3D`).
 */
export function parseW1RomHex(input: string): string | undefined {
  const hex = input.replace(/[\s:.\-]/g, "").toLowerCase();
  if (hex.length !== HEX_PAIR) return undefined;
  if (!/^[0-9a-f]+$/.test(hex)) return undefined;
  return hex;
}

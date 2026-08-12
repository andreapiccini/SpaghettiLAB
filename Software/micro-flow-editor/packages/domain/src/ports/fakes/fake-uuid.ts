import type { UuidGenerator } from "../uuid.js";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toHex(value: number, length: number): string {
  return value.toString(16).padStart(length, "0");
}

/**
 * Deterministic, sequential UUID generator for tests: never random, always
 * reproducible, and shaped like a real UUID (8-4-4-4-12 hex) so its output
 * round-trips through the branded ID constructors in `ids.ts`.
 */
export class FakeUuidGenerator implements UuidGenerator {
  private counter = 0;
  private readonly seedHex: string;

  constructor(seed: string = "fake") {
    this.seedHex = toHex(hashSeed(seed), 8);
  }

  generate(): string {
    this.counter += 1;
    return `${this.seedHex}-0000-4000-8000-${toHex(this.counter, 12)}`;
  }
}

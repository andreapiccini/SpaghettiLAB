import type { UuidGenerator } from "../uuid.js";

/** Deterministic, sequential ID generator for tests: never random, always reproducible. */
export class FakeUuidGenerator implements UuidGenerator {
  private counter = 0;

  constructor(private readonly prefix: string = "fake-id") {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}

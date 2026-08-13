import type { UuidGenerator } from "@spaghettilab/domain";

/** The real `UuidGenerator` port (S011) implementation for a browser runtime — every modern browser's `crypto.randomUUID()`, no library needed. */
export class BrowserUuidGenerator implements UuidGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}

import type { Clock } from "@spaghettilab/domain";

/** The real `Clock` port implementation for a browser runtime — same pattern as `BrowserUuidGenerator`. */
export class BrowserClock implements Clock {
  now(): Date {
    return new Date();
  }
}

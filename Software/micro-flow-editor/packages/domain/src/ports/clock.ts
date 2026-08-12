/** Abstract source of the current time, so domain code never calls `Date.now()`/`new Date()` directly and stays testable without the system clock. */
export interface Clock {
  now(): Date;
}

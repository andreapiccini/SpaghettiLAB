/**
 * Pure exponential-backoff timing for reconnect attempts (S030 point 7
 * "backoff"). Actually re-establishing a transport connection is outside
 * this package's scope — it depends on the concrete transport (MQTT/
 * WebSocket/WebSerial, S023), which `core-session` doesn't construct — this
 * is the piece that *is* this package's job: how long to wait before the
 * caller's next attempt, deterministic and testable without a network.
 */
export function computeBackoffDelayMs(attempt: number, baseMs = 500, maxMs = 30_000): number {
  if (attempt < 0) throw new Error("attempt must be non-negative");
  const exponential = baseMs * 2 ** attempt;
  return Math.min(exponential, maxMs);
}

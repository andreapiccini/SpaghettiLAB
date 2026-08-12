/**
 * Explicit success/failure, never a thrown exception for expected domain
 * failures (invalid ID, duplicate, dangling reference, ...). Keeps failures
 * inspectable in tests and by future UI/adapters without try/catch.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<E, T = never>(error: E): Result<T, E> {
  return { ok: false, error };
}

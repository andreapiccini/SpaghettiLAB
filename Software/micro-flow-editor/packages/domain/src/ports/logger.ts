/** Structured logging port. Context is a plain object, never string-interpolated, so log fields stay queryable regardless of the sink (console, remote collector, test buffer). */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

import type { Logger } from "../logger.js";

export type RecordedLogEntry = {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  context: Record<string, unknown> | undefined;
};

/** `Logger` that records every call in memory instead of printing, so tests can assert on it. */
export class RecordingLogger implements Logger {
  readonly entries: RecordedLogEntry[] = [];

  debug(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "debug", message, context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "info", message, context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "warn", message, context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "error", message, context });
  }
}

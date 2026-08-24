import type { BufferedTelemetryEntry } from "./buffer-store.js";
import type { TelemetryGap } from "./entities.js";

export const TELEMETRY_SINK_API_VERSION = 1;

export interface TelemetrySink {
  readonly apiVersion: typeof TELEMETRY_SINK_API_VERSION;
  readonly id: string;
  append(entry: BufferedTelemetryEntry): void | Promise<void>;
  recordGap(gap: TelemetryGap): void | Promise<void>;
}

export type TelemetrySinkFailureHandler = (sinkId: string, error: unknown) => void;

export class TelemetrySinkFanout {
  readonly #sinks: readonly TelemetrySink[];
  readonly #onFailure: TelemetrySinkFailureHandler;

  constructor(sinks: readonly TelemetrySink[], onFailure: TelemetrySinkFailureHandler) {
    const ids = new Set<string>();
    for (const sink of sinks) {
      if (sink.apiVersion !== TELEMETRY_SINK_API_VERSION)
        throw new Error(
          `Unsupported telemetry sink API ${sink.apiVersion}; expected ${TELEMETRY_SINK_API_VERSION}`,
        );
      if (!sink.id.trim()) throw new Error("Telemetry sink id must not be empty");
      if (ids.has(sink.id))
        throw new Error(`Telemetry sink already registered: ${sink.id}`);
      ids.add(sink.id);
    }
    this.#sinks = Object.freeze([...sinks]);
    this.#onFailure = onFailure;
  }

  async append(entry: BufferedTelemetryEntry): Promise<void> {
    await this.#deliver((sink) => sink.append(entry));
  }

  async recordGap(gap: TelemetryGap): Promise<void> {
    await this.#deliver((sink) => sink.recordGap(gap));
  }

  async #deliver(
    deliver: (sink: TelemetrySink) => void | Promise<void>,
  ): Promise<void> {
    for (const sink of this.#sinks) {
      try {
        await deliver(sink);
      } catch (error) {
        this.#onFailure(sink.id, error);
      }
    }
  }
}

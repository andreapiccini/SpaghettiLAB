import type { EventStream } from "@spaghettilab/protocol-sdk";
import type { ResolveFields, TelemetryFields } from "@spaghettilab/telemetry-buffer";

export type RecordSourceFilter = {
  readonly sourceKey?: number;
  readonly schemaId?: string;
};

export type RecordSourceMessage = {
  readonly sourceKey: number;
  readonly sequence: number;
  readonly schemaId: string;
  readonly schemaVersion: number;
  /** `undefined` when no `resolveFields` was given, or it returned `undefined` for this schema — never invented, same "unknown schema, not an error" stance as `@spaghettilab/telemetry-buffer` (S091). */
  readonly fields?: TelemetryFields;
};

/**
 * Drains `stream` for the `record source` node — filters `RECORD` events by
 * `sourceKey`/`schemaId` and emits one `RecordSourceMessage` per match.
 * Reuses `@spaghettilab/telemetry-buffer`'s `ResolveFields` type (not a
 * parallel field-decoding concept) for the same reason S091 documents it as
 * caller-supplied: no Protocol V1 operation or MQTT-payload decoder for real
 * record bytes exists in `@spaghettilab/protocol-sdk` today. Runs until
 * `stream` is disposed, same lifecycle as `@spaghettilab/telemetry-buffer`'s
 * `subscribeCore()` — this function is the `record source` node's equivalent
 * for a single filtered subscription instead of a whole Core's buffer.
 */
export async function runRecordSource(stream: EventStream, coreId: string, filter: RecordSourceFilter, onMessage: (msg: RecordSourceMessage) => void, resolveFields?: ResolveFields): Promise<void> {
  for await (const event of stream) {
    if (event.kind !== "record") continue;
    const { sourceKey, sequence, schemaId, schemaVersion } = event.payload;
    if (filter.sourceKey !== undefined && filter.sourceKey !== sourceKey) continue;
    if (filter.schemaId !== undefined && filter.schemaId !== schemaId) continue;

    const fields = resolveFields ? await resolveFields({ coreId, sourceKey, schemaId, schemaVersion, sequence }) : undefined;
    onMessage({ sourceKey, sequence, schemaId, schemaVersion, fields });
  }
}

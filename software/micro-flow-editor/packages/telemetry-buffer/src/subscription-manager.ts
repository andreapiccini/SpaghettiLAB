import type { EventStream, StreamedEvent } from "@spaghettilab/protocol-sdk";
import { TelemetryBufferStore } from "./buffer-store.js";
import type { TelemetryContext, TelemetryFields } from "./entities.js";
import {
  TelemetrySinkFanout,
  type TelemetrySink,
  type TelemetrySinkFailureHandler,
} from "./sink.js";

export type ResolveFieldsParams = {
  readonly coreId: string;
  readonly sourceKey: number;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly sequence: number;
};

/**
 * Decodes the *actual* field values for one record notification — see
 * `entities.ts`'s doc comment for why this must be caller-supplied: neither
 * a Protocol V1 operation nor an MQTT-payload decoder for real record bytes
 * exists in `@spaghettilab/protocol-sdk` today. Returning `undefined` means
 * "unknown schema" (S091 point 2), not an error — the record is still
 * retained, just without invented field interpretation.
 */
export type ResolveFields = (
  params: ResolveFieldsParams,
) => TelemetryFields | undefined | Promise<TelemetryFields | undefined>;

export type ResolveContext = (
  coreId: string,
  sourceKey: number,
) => TelemetryContext | undefined;

export type SubscribeCoreOptions = {
  readonly resolveFields?: ResolveFields;
  readonly resolveContext?: ResolveContext;
  /** Preserved on an unknown-schema record if the caller has the raw bytes available (e.g. from an MQTT message handler run alongside this subscription) — this package never fetches them itself. */
  readonly resolveRawPayload?: (params: ResolveFieldsParams) => Uint8Array | undefined;
  readonly sinks?: readonly TelemetrySink[];
  readonly onSinkFailure?: TelemetrySinkFailureHandler;
};

/**
 * Drains one Core's `EventStream` (S024) into a shared `TelemetryBufferStore`,
 * tagging every entry with `coreId` so buffers for different Cores never mix
 * even though they may share the same `schemaId` (S091 § Verifiche). Runs
 * until the stream is disposed; the returned promise resolves then — a
 * caller typically does not await it, just holds onto it or the `stream`
 * itself to call `.dispose()` later.
 */
export async function subscribeCore(
  store: TelemetryBufferStore,
  coreId: string,
  stream: EventStream,
  options: SubscribeCoreOptions = {},
): Promise<void> {
  if ((options.sinks?.length ?? 0) > 0 && !options.onSinkFailure)
    throw new Error("onSinkFailure is required when telemetry sinks are configured");
  const fanout = options.sinks
    ? new TelemetrySinkFanout(options.sinks, options.onSinkFailure ?? (() => undefined))
    : undefined;
  for await (const event of stream) {
    await handleEvent(store, coreId, event, options, fanout);
  }
}

async function handleEvent(
  store: TelemetryBufferStore,
  coreId: string,
  event: StreamedEvent,
  options: SubscribeCoreOptions,
  fanout?: TelemetrySinkFanout,
): Promise<void> {
  if (event.kind === "status") {
    const gap = store.observeBootId(coreId, event.payload.bootId);
    if (gap) await fanout?.recordGap(gap);
    return;
  }
  if (event.kind === "gap") {
    // boot_id_changed is handled structurally via observeBootId (fed from the
    // STATUS payload's real bootId comparison) — routing EventStream's own
    // text-only boot_id_changed gap here too would double-log the same
    // discontinuity. Only sequence_discontinuity has no other source.
    if (event.reason === "sequence_discontinuity") {
      const gap = store.recordSequenceGap(coreId, event.detail);
      await fanout?.recordGap(gap);
    }
    return;
  }
  if (event.kind !== "record") return;

  const { sourceKey, sequence, schemaId, schemaVersion } = event.payload;
  const params: ResolveFieldsParams = {
    coreId,
    sourceKey,
    schemaId,
    schemaVersion,
    sequence,
  };
  const context = options.resolveContext?.(coreId, sourceKey);
  const bootEpoch = store.bootEpochOf(coreId);
  const bootId = store.lastBootIdOf(coreId);
  const provenanceBase = { sourceKey, schemaVersion, bootId, bootEpoch, sequence };

  const fields = await options.resolveFields?.(params);
  if (fields === undefined) {
    const rawPayload = options.resolveRawPayload?.(params);
    const entry = store.pushUnknownSchema(
      coreId,
      schemaId,
      provenanceBase,
      rawPayload,
      context,
    );
    await fanout?.append(entry);
    return;
  }
  const entry = store.pushDecoded(coreId, schemaId, fields, provenanceBase, context);
  await fanout?.append(entry);
}

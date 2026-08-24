import { decodeEvent, EventType } from "../envelope.js";
import {
  decodeConnectivityEventPayload,
  decodeDiscoveryEventPayload,
  decodeRecordEventPayload,
  decodeStatusEventPayload,
  type ConnectivityEventPayload,
  type DiscoveryEventPayload,
  type RecordEventPayload,
  type StatusEventPayload,
} from "../events.js";
import type { ProtocolTransport } from "./transport.js";

export type StreamedRecordEvent = { readonly kind: "record"; readonly payload: RecordEventPayload };
export type StreamedStatusEvent = { readonly kind: "status"; readonly payload: StatusEventPayload };
export type StreamedDiscoveryEvent = { readonly kind: "discovery"; readonly payload: DiscoveryEventPayload };
export type StreamedConnectivityEvent = { readonly kind: "connectivity"; readonly payload: ConnectivityEventPayload };

/**
 * A gap is always a first-class item in the stream, never a silently
 * dropped/skipped record (S024 "un reconnect con boot ID cambiato segnala
 * esplicitamente il gap, non lo nasconde"). `boot_id_changed` means the
 * firmware itself rebooted — nothing before this point can be assumed
 * continuous with what follows, matching `SpaghettiClient`'s own reboot
 * handling (S022). `sequence_discontinuity` means one or more records from
 * the same source were missed without a reboot (e.g. host backpressure
 * upstream of this stream, or a transient transport loss).
 */
export type StreamedGapEvent = {
  readonly kind: "gap";
  readonly reason: "boot_id_changed" | "sequence_discontinuity";
  readonly detail: string;
};

export type StreamedEvent =
  | StreamedRecordEvent
  | StreamedStatusEvent
  | StreamedDiscoveryEvent
  | StreamedConnectivityEvent
  | StreamedGapEvent;

export type EventStreamOptions = {
  /** Bounded buffer capacity — the oldest buffered event is dropped (never grown unbounded) once full. Default 256. */
  readonly capacity?: number;
};

/**
 * Observable stream of Core events (record/status/discovery/connectivity)
 * over a `ProtocolTransport` (S022/S023), with explicit backpressure and gap
 * signaling instead of either accumulating without bound or silently losing
 * data. Consumed via the async iterator (`for await (const event of
 * stream)`) — a pull-based shape gives the consumer real control over pace,
 * which is what makes the backpressure policy below meaningful rather than
 * cosmetic.
 */
export class EventStream implements AsyncIterable<StreamedEvent> {
  private readonly capacity: number;
  private readonly buffer: StreamedEvent[] = [];
  private readonly waitingConsumers: Array<(event: StreamedEvent) => void> = [];
  private readonly unsubscribe: () => void;
  private lastKnownBootId: bigint | null = null;
  private readonly lastSequenceBySourceKey = new Map<number, number>();
  private dropCount = 0;

  constructor(transport: ProtocolTransport, options: EventStreamOptions = {}) {
    this.capacity = options.capacity ?? 256;
    this.unsubscribe = transport.onEvent((bytes) => this.handleIncoming(bytes));
  }

  /** Total events dropped by the bounded buffer so far — always queryable, never hidden. */
  get droppedCount(): number {
    return this.dropCount;
  }

  dispose(): void {
    this.unsubscribe();
  }

  private handleIncoming(bytes: Uint8Array): void {
    let event;
    try {
      event = decodeEvent(bytes);
    } catch {
      // Malformed/oversized/extra-key event — dropped, same principle as
      // SpaghettiClient's response handling (S022): never crash the channel
      // on unrecoverable garbage.
      return;
    }
    switch (event.type) {
      case EventType.RECORD: {
        let payload: RecordEventPayload;
        try {
          payload = decodeRecordEventPayload(event.payload);
        } catch {
          return;
        }
        this.checkSequenceGap(payload.sourceKey, payload.sequence);
        this.push({ kind: "record", payload });
        return;
      }
      case EventType.STATUS: {
        let payload: StatusEventPayload;
        try {
          payload = decodeStatusEventPayload(event.payload);
        } catch {
          return;
        }
        this.checkBootIdGap(payload.bootId);
        this.push({ kind: "status", payload });
        return;
      }
      case EventType.DISCOVERY: {
        let payload: DiscoveryEventPayload;
        try {
          payload = decodeDiscoveryEventPayload(event.payload);
        } catch {
          return;
        }
        this.push({ kind: "discovery", payload });
        return;
      }
      case EventType.CONNECTIVITY: {
        let payload: ConnectivityEventPayload;
        try {
          payload = decodeConnectivityEventPayload(event.payload);
        } catch {
          return;
        }
        this.push({ kind: "connectivity", payload });
        return;
      }
    }
  }

  /** A changed boot ID invalidates continuity for every source, not just the one that happened to report it (a reboot resets the whole Core). */
  private checkBootIdGap(bootId: bigint): void {
    if (this.lastKnownBootId !== null && bootId !== this.lastKnownBootId) {
      this.push({
        kind: "gap",
        reason: "boot_id_changed",
        detail: `boot ID changed from ${this.lastKnownBootId} to ${bootId} — a reconnect occurred, nothing before this point is continuous with what follows`,
      });
      this.lastSequenceBySourceKey.clear();
    }
    this.lastKnownBootId = bootId;
  }

  private checkSequenceGap(sourceKey: number, sequence: number): void {
    const last = this.lastSequenceBySourceKey.get(sourceKey);
    if (last !== undefined && sequence !== last + 1) {
      this.push({
        kind: "gap",
        reason: "sequence_discontinuity",
        detail: `source ${sourceKey}: expected sequence ${last + 1}, got ${sequence}`,
      });
    }
    this.lastSequenceBySourceKey.set(sourceKey, sequence);
  }

  private push(event: StreamedEvent): void {
    const waitingConsumer = this.waitingConsumers.shift();
    if (waitingConsumer) {
      waitingConsumer(event);
      return;
    }
    if (this.buffer.length >= this.capacity) {
      // Backpressure: drop the oldest buffered event rather than growing
      // without bound. The drop is never silent — `droppedCount` is always
      // queryable, and a consumer that checks it after a gap-shaped surprise
      // can tell "the firmware skipped a sequence" (`sequence_discontinuity`)
      // apart from "this stream itself couldn't keep up" (`droppedCount`).
      this.buffer.shift();
      this.dropCount++;
    }
    this.buffer.push(event);
  }

  /** Resolves with the next event, waiting if none is buffered yet. */
  next(): Promise<StreamedEvent> {
    const buffered = this.buffer.shift();
    if (buffered) return Promise.resolve(buffered);
    return new Promise((resolve) => this.waitingConsumers.push(resolve));
  }

  [Symbol.asyncIterator](): AsyncIterator<StreamedEvent> {
    return {
      next: async () => ({ value: await this.next(), done: false }),
    };
  }
}

import { encodeEvent, EventType } from "../../envelope.js";
import {
  encodeConnectivityEventPayload,
  encodeDiscoveryEventPayload,
  encodeRecordEventPayload,
  encodeStatusEventPayload,
} from "../../events.js";

/**
 * Deterministic event fixtures for developing/testing the app without a
 * physical Core (S024 "Pubblica fixture fake deterministiche"). Every
 * builder here is a pure function of its arguments — no `Math.random`, no
 * wall-clock time — so the same call produces byte-identical output on every
 * run, in every test, forever.
 */

export function fakeRecordEvent(sequence: number, sourceKey = 1, schemaId = "fake.sample", schemaVersion = 1): Uint8Array {
  return encodeEvent({
    sequence,
    type: EventType.RECORD,
    payload: encodeRecordEventPayload({ sourceKey, sequence, schemaId, schemaVersion }),
  });
}

export function fakeStatusEvent(sequence: number, bootId: bigint, queueDepth = 0, dropCount = 0): Uint8Array {
  return encodeEvent({
    sequence,
    type: EventType.STATUS,
    payload: encodeStatusEventPayload({ deviceId: new Uint8Array([0xfa, 0xce]), bootId, queueDepth, dropCount }),
  });
}

export function fakeDiscoveryEvent(sequence: number, candidateId: number, portId = 0, generation = 1): Uint8Array {
  return encodeEvent({
    sequence,
    type: EventType.DISCOVERY,
    payload: encodeDiscoveryEventPayload({ candidateId, portId, generation }),
  });
}

export function fakeConnectivityEvent(sequence: number, policy = 1, activeServices = 0, lastError = 0n): Uint8Array {
  return encodeEvent({
    sequence,
    type: EventType.CONNECTIVITY,
    payload: encodeConnectivityEventPayload({ policy, activeServices, lastError }),
  });
}

/** A steady run of `count` record events from one source, sequence 1..count — the common case. */
export function fakeRecordEventSequence(count: number, sourceKey = 1): Uint8Array[] {
  const events: Uint8Array[] = [];
  for (let i = 1; i <= count; i++) {
    events.push(fakeRecordEvent(i, sourceKey));
  }
  return events;
}

/**
 * A reboot scenario: a few records under boot ID 1, a `STATUS` event
 * reporting boot ID 2 (the reconnect), then a few more records with sequence
 * restarting from 1 — deterministic input for exercising `EventStream`'s
 * `boot_id_changed` gap detection (see `event-stream.test.ts`) without a
 * physical Core rebooting.
 */
export function fakeRebootScenario(sourceKey = 1): Uint8Array[] {
  return [
    fakeStatusEvent(1, 1n),
    fakeRecordEvent(1, sourceKey),
    fakeRecordEvent(2, sourceKey),
    fakeStatusEvent(2, 2n),
    fakeRecordEvent(1, sourceKey),
    fakeRecordEvent(2, sourceKey),
  ];
}

import { describeCoreStatus, type CoreStatusView } from "@spaghettilab/core-status";
import type { EventStream, SpaghettiClient } from "@spaghettilab/protocol-sdk";

/**
 * The `status` node's read — reuses `@spaghettilab/core-status`'s real
 * `describeCoreStatus()` (S093) for the exact same enum labels the React
 * Flow app shows, instead of re-decoding `GetStatusResponse`'s raw numbers
 * itself.
 */
export async function fetchCoreStatus(client: SpaghettiClient): Promise<CoreStatusView> {
  const response = await client.getStatus();
  return describeCoreStatus(response);
}

/**
 * Drains `stream` for `STATUS` events and calls `onStatusEvent` with the raw
 * boot id / queue depth / drop count each time one arrives — the trigger a
 * `status` node uses to know when to re-`fetchCoreStatus()` rather than
 * polling on a timer. Runs until `stream` is disposed.
 */
export async function watchStatusEvents(stream: EventStream, onStatusEvent: (bootId: bigint, queueDepth: number, dropCount: number) => void): Promise<void> {
  for await (const event of stream) {
    if (event.kind !== "status") continue;
    onStatusEvent(event.payload.bootId, event.payload.queueDepth, event.payload.dropCount);
  }
}

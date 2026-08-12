import type { MqttConnection } from "../mqtt-transport.js";

/** In-memory `MqttConnection` for tests — no real broker involved. */
export class FakeMqttConnection implements MqttConnection {
  readonly published: Array<{ topic: string; payload: Uint8Array }> = [];
  private readonly subscribers = new Map<string, Set<(payload: Uint8Array) => void>>();

  publish(topic: string, payload: Uint8Array): Promise<void> {
    this.published.push({ topic, payload });
    return Promise.resolve();
  }

  subscribe(topic: string, handler: (payload: Uint8Array) => void): () => void {
    let set = this.subscribers.get(topic);
    if (!set) {
      set = new Set();
      this.subscribers.set(topic, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /** Test-only: simulates the broker delivering a message on `topic`. */
  deliver(topic: string, payload: Uint8Array): void {
    for (const handler of this.subscribers.get(topic) ?? []) handler(payload);
  }
}

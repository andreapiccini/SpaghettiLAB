/**
 * Transport-independent byte channel `SpaghettiClient` sends encoded
 * envelopes over and receives them from — MQTT/WebSocket/BLE (S023) each
 * implement this the same way. Responses and events are separate callbacks
 * rather than one combined channel because a real transport already knows
 * which is which from its own framing/topic (e.g. a per-request reply topic
 * vs a broadcast event topic in MQTT); `SpaghettiClient` needs that
 * distinction to correlate responses and to watch `STATUS` events for boot
 * ID changes (see `spaghetti-client.ts`'s reboot handling) without guessing
 * from the ambiguous raw envelope shape alone.
 *
 * Never carries credentials: a `ProtocolTransport` implementation resolves
 * its own connection secret via the `CredentialStore` port (S121) before
 * `SpaghettiClient` ever touches it — `SpaghettiClient`'s entire public
 * surface has no parameter through which a secret could pass, by
 * construction, not by convention.
 */
export interface ProtocolTransport {
  send(bytes: Uint8Array): Promise<void>;
  /** Registers a handler for incoming response envelopes; returns an unsubscribe function. */
  onResponse(handler: (bytes: Uint8Array) => void): () => void;
  /** Registers a handler for incoming event envelopes; returns an unsubscribe function. */
  onEvent(handler: (bytes: Uint8Array) => void): () => void;
}

# MQTT Service

[← Project README](../../../README.md) · [Architecture](../../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

MQTT provides external publish/subscribe delivery without coupling sensors,
Runtime, or Data to networking and broker state.

## Responsibility

Own MQTT client state, endpoint, subscriptions, RX/TX buffers, keepalive,
reconnect/backoff, bounded outbound queue, and later TLS credentials integration.

## Non-responsibility

No sensor scheduling, rule evaluation, module lifecycle, Wi-Fi provisioning, or
unbounded offline history.

## Files

Only this design README exists. Future public/private files should be introduced
when the MQTT milestone fixes the contract; they must not leak Zephyr client
internals into Data.

## Data structures to implement

- service config: copied from validated Config, owned by MQTT while active.
- client context/buffers: created and destroyed by MQTT, never exposed.
- outbound item: copied bounded representation, owned by queue then MQTT thread.
- connection/status snapshot: MQTT-modified, read by Communication.

## Functions to implement

### `spaghetti_mqtt_init()`

- **Purpose:** allocate static context/queues and register network notifications.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** validated config and Data adapter.
- **Outputs:** status.
- **State modified:** client/queue state.
- **Failure cases:** invalid buffer/config or thread creation failure.
- **Called next:** Zephyr network-event registration and MQTT client init.

### `spaghetti_mqtt_start()` / `_stop()`

- **Purpose:** start/stop the connection state machine.
- **Called by:** Core/Communication/Config reconciliation.
- **Trigger/mechanism/context:** network/config/lifecycle; DIRECT CALL or command
  MESSAGE QUEUE; service thread owns actual socket changes.
- **Inputs:** config generation/reason.
- **Outputs:** accepted/status.
- **State modified:** desired running state.
- **Failure cases:** network absent, invalid endpoint, already stopping.
- **Called next:** MQTT thread connect/disconnect.

### `spaghetti_mqtt_publish()`

- **Purpose:** enqueue one bounded publication without blocking Data producer.
- **Called by:** Data subscriber adapter.
- **Trigger:** normalized measurement/event.
- **Invocation mechanism:** ZBUS SUBSCRIBER or direct adapter callback, followed by
  MESSAGE QUEUE to MQTT THREAD.
- **Execution context:** subscriber copies; MQTT thread performs network I/O.
- **Inputs:** topic mapping/key, payload, QoS/retention policy.
- **Outputs:** queued/full/disconnected-policy result.
- **State modified:** outbound queue/statistics.
- **Failure cases:** full queue, oversized payload, invalid topic, disabled service.
- **Called next:** Zephyr MQTT publish in MQTT thread.

### `spaghetti_mqtt_get_status()`

- **Purpose:** expose connection/reconnect/drop diagnostics.
- **Called by:** Communication/tests.
- **Trigger/mechanism/context:** query; DIRECT CALL; caller thread.
- **Inputs/outputs:** copied snapshot.
- **State modified:** none.
- **Failure cases:** invalid output/not initialized.
- **Called next:** none.

## Interaction diagram

```text
Network event --CALLBACK--> MQTT command queue --> MQTT THREAD
Data --ZBUS SUBSCRIBER?--> publish --MESSAGE QUEUE--> MQTT THREAD --> broker
Broker --> socket POLL --> MQTT THREAD --> command/Data adapter
```

## State / lifecycle

```text
STOPPED -> WAIT_NETWORK -> CONNECTING -> ONLINE
                      ^        |           |
                      +-- BACKOFF <--- DISCONNECTED
ONLINE -> STOPPING -> STOPPED
```

## Concurrency considerations

One dedicated thread is justified because socket poll, MQTT input, keepalive, and
reconnect form a blocking state machine. Data producers only enqueue. Queue-full
policy must be explicit; never hold Data locks across network calls. Network
callbacks signal rather than connect inline.

## Zephyr concepts involved

Network management callback reports interface/IP state; MQTT uses sockets;
`k_poll` waits for socket/events; `k_msgq` bounds outbound work; TLS uses mbedTLS
and credentials configured separately. zbus is only the optional Data fan-out.

## Implementation steps

1. Connect a static test client to a local broker.
2. Implement poll/input/keepalive in one thread.
3. Add disconnect/backoff.
4. Add bounded outbound queue.
5. Map one Data temperature message to a topic/payload.
6. Add subscriptions only when a concrete command exists.
7. Add TLS after plain local operation is stable.

## Expected result

Measurements reach a broker; broker/network restart does not block Runtime and
automatically enters bounded reconnect behavior.

## Minimal test

Publish one static value, stop/restart broker, verify reconnect and drop counters.

## Dependencies

Working IP network, Config endpoint, Data contract; Communication only for status.

## Not yet

No unlimited offline buffering, cloud provisioning, OTA, or secrets in source.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_mqtt_init` | Core | boot | DIRECT CALL | main thread | network callback, MQTT init |
| `spaghetti_mqtt_start` | Core/Config | enable/network config | DIRECT CALL + command MSGQ | caller then MQTT thread | connect state machine |
| `spaghetti_mqtt_stop` | Core/Config | disable | command MSGQ | MQTT thread | disconnect |
| `spaghetti_mqtt_publish` | Data adapter | measurement | subscriber + MESSAGE QUEUE | producer then MQTT thread | Zephyr MQTT publish |
| `spaghetti_mqtt_get_status` | Communication | query | DIRECT CALL | caller thread | none |

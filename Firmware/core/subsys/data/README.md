# Data

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Data gives measurements, actuator state, and events a common contract so a
producer does not know every consumer.

## Responsibility

Own message semantics, validation, timestamps, payload lifetime rules, delivery
policy, and observable backpressure/drop behavior.

## Non-responsibility

No sensor acquisition, automation evaluation, MQTT serialization, persistence
policy, or module lifecycle.

## Files

- Public API: `include/spaghetti/data.h`; types and publish/consumer contract.
- Implementation: `subsys/data/data.c`; validation and selected transport.

## Data structures to implement

- `spaghetti_data`: value object created by producer or Data factory, copied into
  bounded transport, then owned by consumer copy; contains source instance,
  channel/type, value, unit, timestamp, quality, sequence.
- `spaghetti_value`: tagged bounded payload; no borrowed stack pointers.
- channel descriptors: immutable, owned by Data, read by all participants.
- delivery statistics: Data-owned counters for drops/full queues.

## Functions to implement

### `spaghetti_data_init()`

- **Purpose:** initialize channels/queues and validate payload sizes.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** static channel configuration.
- **Outputs:** status.
- **State modified:** Data internals/statistics.
- **Failure cases:** invalid size/capacity or transport setup.
- **Called next:** zbus/channel or queue initialization as selected.

### `spaghetti_data_publish()`

- **Purpose:** validate and distribute one normalized item.
- **Called by:** module acquisition path, Manager, Power, Runtime-derived data.
- **Trigger:** completed acquisition or state transition.
- **Invocation mechanism:** DIRECT CALL into Data; downstream ZBUS PUBLISH or
  MESSAGE QUEUE is DECISION REQUIRED.
- **Execution context:** producer thread; not ISR initially; bounded wait only.
- **Inputs:** complete value object and timeout policy.
- **Outputs:** delivered/dropped/full/error result.
- **State modified:** channel message/statistics.
- **Failure cases:** invalid type/source, oversized payload, queue full, timeout.
- **Called next:** zbus publish or queue put; never slow MQTT directly.

### `spaghetti_data_validate()`

- **Purpose:** enforce contract independently of transport.
- **Called by:** publish, tests, Communication ingress for data commands.
- **Trigger/mechanism/context:** message creation; DIRECT CALL; caller thread.
- **Inputs:** data item.
- **Outputs:** validation result.
- **State modified:** none.
- **Failure cases:** invalid tag/unit/source/size.
- **Called next:** none.

### `spaghetti_data_get_stats()`

- **Purpose:** expose delivery/drop diagnostics.
- **Called by:** Communication/shell/tests.
- **Trigger/mechanism/context:** diagnostics; DIRECT CALL; caller thread.
- **Inputs:** output snapshot.
- **Outputs:** counters.
- **State modified:** none or explicit reset only through separate future API.
- **Failure cases:** invalid output/not initialized.
- **Called next:** none.

## Interaction diagram

```text
Driver/Manager --DIRECT CALL publish--> Data
Data --ZBUS PUBLISH?--> Runtime subscriber
     --ZBUS PUBLISH?--> MQTT subscriber -> MQTT queue/thread
     --ZBUS PUBLISH?--> Communication subscriber
```

## State / lifecycle

Initialize once; channels remain active for firmware lifetime. Individual values
move conceptually through CREATED -> VALIDATED -> ENQUEUED/PUBLISHED -> CONSUMED
or DROPPED.

## Concurrency considerations

Multiple producers/consumers are expected. Direct callbacks are cheapest but can
block and couple components. `k_msgq` gives strict bounded FIFO semantics but
fan-out requires copies. zbus naturally fans out but observer type determines
loss semantics. RECOMMENDATION: prototype both with representative sizes before
freezing the contract; commands needing guaranteed delivery should not share a
lossy measurement channel.

## Zephyr concepts involved

- zbus is a channel-based publish/subscribe service.
- `k_msgq` copies fixed-size messages into a bounded ring and can block threads.
- uptime is monotonic since boot; wall-clock time requires synchronization.
- atomic counters or a short mutex can protect statistics.

## Implementation steps

1. Define one bounded temperature value.
2. Document ownership and timestamp source.
3. Implement validation.
4. Implement a one-consumer queue prototype.
5. Compare with zbus for three consumers.
6. Freeze drop/backpressure policy and expose statistics.

## Expected result

One temperature item reaches Runtime and external-publish consumers with tested,
visible behavior when capacity is exhausted.

## Minimal test

Publish known values to two fake consumers, then fill capacity and verify policy.

## Dependencies

Module identifiers and selected Zephyr transport configuration.

## Not yet

No unbounded strings, generic heap blobs, storage history, or network formatting.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_data_init` | Core | boot | DIRECT CALL | main thread | zbus/queue setup |
| `spaghetti_data_publish` | driver/Manager/Runtime | new value/event | DIRECT CALL + ZBUS/MSGQ TBD | producer thread | selected transport |
| `spaghetti_data_validate` | publisher/tests | message creation | DIRECT CALL | caller thread | none |
| `spaghetti_data_get_stats` | Communication/tests | diagnostics | DIRECT CALL | caller thread | none |

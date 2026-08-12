# Communication

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

Communication Protocol V1 is transport-independent. Adapters (USB Shell, Remote
Console, and future MQTT/BLE) build `spaghetti_protocol_request` envelopes and
call `spaghetti_communication_handle_request()` with an authenticated
`spaghetti_request_context`.

## Contracts

`include/spaghetti/protocol.h` defines operation IDs 1–27, public status codes,
canonical CBOR envelopes, event codecs, and iterable operation handlers.
`include/spaghetti/communication.h` exposes init, dispatch, and session
invalidation hooks.

```c
int spaghetti_communication_handle_request(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_request *request,
	struct spaghetti_protocol_response *response);
```

Dispatch validates the envelope, authorizes the principal against the handler
requirements and adapter-capped permissions, consults the replay cache, then
runs immediate reads, serialized mutations, or async jobs. Public status is
mapped from errno by `spaghetti_protocol_status_from_errno()`.

## Replay, mutations, and jobs

- Replay cache key: `principal_id + correlation_id`
- Same request bytes → cached response; different bytes/op → CONFLICT
- TTL: `CONFIG_SPAGHETTI_PROTOCOL_REPLAY_WINDOW_MS`
- Capacity: `CONFIG_SPAGHETTI_MAX_INFLIGHT_REQUESTS`
- Mutations run on a Communication worker, never inside MQTT/BLE callbacks
- Async jobs return `job_id`; poll with `GET_JOB_STATUS`

## Adapter policies

| Adapter | Max permissions |
|---|---|
| USB Shell (Maintenance/Unprovisioned) | all |
| USB Shell (Normal) | read\|configure\|command\|discover\|update |
| Remote Console TLS | read\|configure\|command\|discover (never provision) |

Shell and Remote Console keep human commands (`spaghetti status`,
`spaghetti apply <hex>`) but construct Protocol V1 requests internally.

## Operations

See [operations/README.md](operations/README.md).

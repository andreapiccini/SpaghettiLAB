# Communication

## 1. Purpose

Communication is the transport-independent protocol boundary between the Core
and PC/backend/frontend.

## 2. Responsibility

Frame validation, protocol versioning, request correlation, command routing,
response/event encoding, sessions, and transport adapters.

## 3. Non-responsibility

No module lifecycle ownership, runtime evaluation, raw sensor access, persistent
storage, or direct coupling of the protocol to C struct layout.

## 4. Files

- Public API: `include/spaghetti/communication.h`.
- Implementation: `subsys/communication/communication.c`.
- Future transport adapters should remain separate from protocol handling.

## 5. Data structures to implement

- protocol message: bounded value object with version/type/request ID/payload.
- session: created/owned/destroyed by Communication on connect/disconnect.
- transport descriptor: immutable callbacks owned by adapter; registered/read by
  Communication.
- RX/TX buffers and request table: Communication-owned, bounded lifetime.

## 6. Functions to implement

### `spaghetti_communication_init()` / `_start()`

- **Purpose:** initialize protocol state, adapters, queues, and begin reception.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** transport/config dependencies.
- **Outputs:** status.
- **State modified:** sessions/queues/running state.
- **Failure cases:** no required transport, allocation/configuration failure.
- **Called next:** adapter init/start by DIRECT CALL.

### `spaghetti_communication_receive()`

- **Purpose:** accept bytes/frame from an adapter and route a validated request.
- **Called by:** UART/USB/network adapter.
- **Trigger:** incoming transport data.
- **Invocation mechanism:** CALLBACK or POLL; copy then WORKQUEUE/THREAD for parse.
- **Execution context:** callback may be constrained; parsing/routing in
  communication worker, never ISR.
- **Inputs:** session, bounded byte span.
- **Outputs:** accepted/full/protocol error.
- **State modified:** RX buffer/request state.
- **Failure cases:** overflow, malformed frame, unsupported version, duplicate ID.
- **Called next:** Config/Discovery/Manager/Runtime by DIRECT CALL from worker.

### `spaghetti_communication_send_response()` / `_send_event()`

- **Purpose:** serialize responses or unsolicited observations.
- **Called by:** command router and Data subscriber adapter.
- **Trigger/mechanism:** completed request or Data event; DIRECT CALL then TX
  MESSAGE QUEUE to avoid blocking producer.
- **Execution context:** caller copies; communication/TX thread performs I/O.
- **Inputs:** session/request ID or event payload.
- **Outputs:** queued/full/disconnected status.
- **State modified:** TX queue/statistics.
- **Failure cases:** no session, queue full, encoding/transport failure.
- **Called next:** transport send callback/API.

### `spaghetti_communication_get_status()`

- **Purpose:** expose connection/protocol statistics.
- **Called by:** diagnostics/tests.
- **Trigger/mechanism/context:** query; DIRECT CALL; caller thread.
- **Inputs/outputs:** snapshot.
- **State modified:** none.
- **Failure cases:** invalid output/not initialized.
- **Called next:** none.

## 7. Interaction diagram

```text
PC --COMMUNICATION RX--> adapter --CALLBACK--> RX queue
RX queue --THREAD--> Communication router --DIRECT CALL--> Config/Discovery
Data --ZBUS SUBSCRIBER?--> Communication --TX MSGQ--> adapter --> PC
```

## 8. State / lifecycle

```text
STOPPED -> LISTENING -> CONNECTED -> CLOSING -> LISTENING
                         +-------> PROTOCOL_ERROR/DISCONNECTED
```

## 9. Concurrency considerations

Transport callbacks must copy bounded data and return. One worker can serialize
parsing/routing; one TX queue prevents slow I/O from blocking Data. Mutex only
protects session/request tables. zbus is optional for PC event streaming, not
for request/response correlation.

## 10. Zephyr concepts involved

UART/USB/network callbacks report I/O; ring buffers accumulate byte streams;
`k_poll` can wait on multiple signals; `k_msgq` bounds RX/TX work; shell commands
are a useful diagnostic adapter but not the product protocol.

## 11. Implementation steps

1. Define framing limits and versioned message model.
2. Build pure encode/decode tests.
3. Add loopback adapter.
4. Add RX worker and one read-only command.
5. Add manual assignment through Discovery.
6. Add bounded TX event path and statistics.

## 12. Expected result

A PC can query Core/ports, submit manual configuration, receive correlated
errors/responses, and optionally observe Data without blocking acquisition.

## 13. Minimal test

Loopback valid request, malformed/oversized frame, duplicate ID, disconnected TX.

## 14. Dependencies

Core/Port query contracts; Config/Discovery for first mutating command; Data later.

## 15. Not yet

No OTA, custom encryption, unbounded JSON, or hardware-specific protocol fields.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_communication_init/start` | Core | boot | DIRECT CALL | main thread | transport adapter |
| `spaghetti_communication_receive` | adapter | incoming bytes | CALLBACK + WORKQUEUE/THREAD | callback then comm worker | command targets |
| `spaghetti_communication_send_response` | router | command complete | DIRECT CALL + TX MSGQ | comm/TX thread | transport send |
| `spaghetti_communication_send_event` | Data adapter | data event | subscriber + TX MSGQ | subscriber/TX thread | transport send |
| `spaghetti_communication_get_status` | diagnostics | query | DIRECT CALL | caller thread | none |

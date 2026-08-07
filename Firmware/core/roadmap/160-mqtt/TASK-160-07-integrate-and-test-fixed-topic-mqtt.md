# TASK-160-07 — Integrate and test fixed-topic MQTT

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-06](TASK-160-06-queue-temperature-for-a-fixed-development-topic.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Integrate and test fixed-topic MQTT** and produce this focused outcome:

One fixed topic payload.

---

## Open

`CMakeLists.txt`, `subsys/core/core.c`, MQTT service files, and the development broker.

---

## Write / Modify

Add MQTT sources to CMake, initialize/start the service after network readiness, and observe one temperature topic at the broker. Test broker absence, reconnect, and a full outbound queue with the documented policy.

---

## Why

Network and Data independently work.

---

## Called / used by

Core starts; Data subscriber publishes.

---

## Trigger

DATA ARRIVAL/NETWORK EVENT.

---

## Invocation mechanism

ZBUS MSG SUBSCRIBER -> K_MSGQ -> MQTT THREAD -> socket.

---

## Execution context

Subscriber copies; dedicated MQTT thread performs I/O.

---

## Calls / dependencies

Zephyr MQTT/socket/poll APIs.

---

## Inputs

Temperature sample.

---

## Outputs

One fixed topic payload.

---

## Errors to handle

Queue full, disconnected, DNS/connect/publish error, keepalive.

---

## Do NOT implement yet

- Dynamic topics, TLS, QoS matrix, offline history

---

## Steps

- [ ] Open only `CMakeLists.txt`, `subsys/core/core.c`, MQTT service files, and the development broker.
- [ ] Add MQTT sources to CMake, initialize/start the service after network readiness, and observe one temperature topic at the broker.
- [ ] Test broker absence, reconnect, and a full outbound queue with the documented policy.
- [ ] Handle only these realistic errors: Queue full, disconnected, DNS/connect/publish error, keepalive.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Local broker subscriber receives value; stop/restart broker and verify
Runtime sampling continues plus MQTT reconnects.

---

## Expected result

A real temperature reaches the fixed development topic and reconnect behavior is bounded.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`mqtt: integrate and test fixed-topic mqtt`

---

## Next task

[TASK-160-08](TASK-160-08-move-mqtt-settings-into-config.md) — Move MQTT settings into Config

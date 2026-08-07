# TASK-160-04 — Define the MQTT service API

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-03](TASK-160-03-implement-network-readiness-signalling.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the MQTT service API** and produce this focused outcome:

One fixed topic payload.

---

## Open

Create `subsys/services/mqtt/mqtt.h`.

---

## Write / Modify

Declare bounded `spaghetti_mqtt_init()`, `start()`, `publish_temperature()`, and `get_status()` APIs. Define copied endpoint/topic inputs, payload bounds, and service states without exposing Zephyr MQTT internals.

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

- [ ] Open only Create `subsys/services/mqtt/mqtt.h`.
- [ ] Declare bounded `spaghetti_mqtt_init()`, `start()`, `publish_temperature()`, and `get_status()` APIs.
- [ ] Define copied endpoint/topic inputs, payload bounds, and service states without exposing Zephyr MQTT internals.
- [ ] Handle only these realistic errors: Queue full, disconnected, DNS/connect/publish error, keepalive.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

NO

---

## Flash

NO

---

## Test

Local broker subscriber receives value; stop/restart broker and verify
Runtime sampling continues plus MQTT reconnects.

---

## Expected result

Known sample reaches known topic without blocking Runtime.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`mqtt: define the mqtt service api`

---

## Next task

[TASK-160-05](TASK-160-05-implement-the-mqtt-worker-and-client-state.md) — Implement the MQTT worker and client state

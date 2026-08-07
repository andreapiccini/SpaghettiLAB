# TASK-160-08 — Move MQTT settings into Config

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-07](TASK-160-07-integrate-and-test-fixed-topic-mqtt.md)  
**Estimated scope:** Small

---

## Goal

Complete **Move MQTT settings into Config** and produce this focused outcome:

Publish to configured topic.

---

## Open

`include/spaghetti/config.h`, `subsys/config/config.c`, the CBOR schema/codec, and MQTT service files.

---

## Write / Modify

Add only enabled flag, bounded broker endpoint, port, and bounded base topic to internal Config. Bump and validate the CBOR schema version, pass a copied MQTT config through its API, and delete every fixed endpoint/topic constant.

---

## Why

Fixed-topic path is proven.

---

## Called / used by

Config applies to MQTT service.

---

## Trigger

CONFIG COMMAND.

---

## Invocation mechanism

DIRECT CALL or MQTT command K_MSGQ for live reconnect.

---

## Execution context

Config caller submits; MQTT thread reconnects.

---

## Calls / dependencies

Codec/Config/MQTT service.

---

## Inputs

Valid bounded endpoint/topic.

---

## Outputs

Publish to configured topic.

---

## Errors to handle

Invalid host/port/topic and live reconfiguration failure.

---

## Do NOT implement yet

- Secrets inside ordinary Config or OTA over MQTT

---

## Steps

- [ ] Open only `include/spaghetti/config.h`, `subsys/config/config.c`, the CBOR schema/codec, and MQTT service files.
- [ ] Add only enabled flag, bounded broker endpoint, port, and bounded base topic to internal Config. Bump and validate the CBOR schema version, pass a copied MQTT config through its API, and delete every fixed endpoint/topic constant.
- [ ] Handle only these realistic errors: Invalid host/port/topic and live reconfiguration failure.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Deploy a second topic and confirm next sample appears there.

---

## Expected result

The configured endpoint/topic reaches the broker and no fixed development MQTT setting remains.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`mqtt: move mqtt settings into config`

---

## Next task

[TASK-170-01](../170-discovery/TASK-170-01-define-discovery-result-types.md) — Define Discovery result types

# TASK-110-01 — Define the temperature sample message

**Status:** ⬜ TODO  
**Phase:** 110 — Data / zbus  
**Depends on:** [TASK-100-06](../100-storage/TASK-100-06-load-config-at-boot-and-test-persistence.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the temperature sample message** and produce this focused outcome:

Publish status.

---

## Open

`include/spaghetti/data.h`.

---

## Write / Modify

Define immutable `spaghetti_temperature_sample` fields for source module ID, fixed-point or micro-unit temperature, humidity if retained, uptime timestamp, sequence number, and validity flags. Declare Data init and bounded publish APIs.

---

## Why

A real sensor works; three future consumers require decoupling.

---

## Called / used by

Acquisition path publishes; logger/Runtime/MQTT/PC consume.

---

## Trigger

DATA ARRIVAL.

---

## Invocation mechanism

DIRECT CALL into Data, then ZBUS PUBLISH.

---

## Execution context

Acquisition/Runtime thread.

---

## Calls / dependencies

zbus later; uptime API for timestamp.

---

## Inputs

Complete copied value, never stack pointer inside payload.

---

## Outputs

Publish status.

---

## Errors to handle

Invalid source/value and publication timeout/full pool.

---

## Do NOT implement yet

- Generic variant payload, MQTT topic, heap strings

---

## Steps

- [ ] Open only `include/spaghetti/data.h`.
- [ ] Define immutable `spaghetti_temperature_sample` fields for source module ID, fixed-point or micro-unit temperature, humidity if retained, uptime timestamp, sequence number, and validity flags.
- [ ] Declare Data init and bounded publish APIs.
- [ ] Handle only these realistic errors: Invalid source/value and publication timeout/full pool.
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

Confirm struct size/alignment and value lifetime are bounded.

---

## Expected result

One precise Data contract.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`data: define the temperature sample message`

---

## Next task

[TASK-110-02](TASK-110-02-enable-zbus-message-subscribers.md) — Enable zbus message subscribers

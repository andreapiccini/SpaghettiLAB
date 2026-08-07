# TASK-130-07 — Test the Relay threshold and safe state

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-130-06](TASK-130-06-evaluate-temperature-in-the-runtime-thread.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test the Relay threshold and safe state** and produce this focused outcome:

Relay ON only for values strictly above threshold.

---

## Open

The real Relay hardware, Runtime test input, and the serial console.

---

## Write / Modify

Inject or produce values below, equal to, and above 25 °C. Confirm strict-greater behavior, no repeated redundant command, safe init/deinit output, and a controlled error when the Relay module is unavailable.

---

## Why

Both sensor Data and relay command work independently.

---

## Called / used by

Config loads; Runtime evaluates.

---

## Trigger

DATA ARRIVAL.

---

## Invocation mechanism

ZBUS MSG SUBSCRIBER -> Runtime THREAD -> DIRECT CALL.

---

## Execution context

Runtime thread.

---

## Calls / dependencies

Data subscriber and Manager command.

---

## Inputs

Temperature sample and one rule.

---

## Outputs

Relay ON only for values strictly above threshold.

---

## Errors to handle

Missing target/source, wrong channel, command failure.

---

## Do NOT implement yet

- Generic operators/actions, hysteresis unless required for safe physical test, rule arrays, scripting

---

## Steps

- [ ] Open only The real Relay hardware, Runtime test input, and the serial console.
- [ ] Inject or produce values below, equal to, and above 25 °C.
- [ ] Confirm strict-greater behavior, no repeated redundant command, safe init/deinit output, and a controlled error when the Relay module is unavailable.
- [ ] Handle only these realistic errors: Missing target/source, wrong channel, command failure.
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

Inject 24.9, 25.0, 25.1 fixed-unit samples; expect no/no/one command.

---

## Expected result

Only temperatures above 25 °C command the configured Relay, which returns to its safe state on deinit.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`relay: test the relay threshold and safe state`

---

## Next task

[TASK-140-01](../140-communication/TASK-140-01-define-bounded-communication-messages.md) — Define bounded Communication messages

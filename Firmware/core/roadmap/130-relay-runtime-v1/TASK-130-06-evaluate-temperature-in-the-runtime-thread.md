# TASK-130-06 — Evaluate temperature in the Runtime thread

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-130-05](TASK-130-05-define-one-threshold-rule.md)  
**Estimated scope:** Small

---

## Goal

Complete **Evaluate temperature in the Runtime thread** and produce this focused outcome:

Relay ON only for values strictly above threshold.

---

## Open

`subsys/runtime/runtime.c` and `subsys/data/data.c`.

---

## Write / Modify

Make Runtime consume temperature messages through a bounded zbus message subscriber or its `k_msgq`. Evaluate `temperature > 25 °C` in the Runtime thread and directly call Manager command only when the desired relay state changes.

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

ZBUS SUBSCRIBER + THREAD + DIRECT CALL

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

## Zephyr note

zbus delivers the sample; rule evaluation and GPIO-driving calls stay in Runtime thread context. Do not perform them in a zbus callback or timer expiry.

---

## Steps

- [ ] Open only `subsys/runtime/runtime.c` and `subsys/data/data.c`.
- [ ] Make Runtime consume temperature messages through a bounded zbus message subscriber or its `k_msgq`. Evaluate `temperature > 25 °C` in the Runtime thread and directly call Manager command only when the desired relay state changes.
- [ ] Handle only these realistic errors: Missing target/source, wrong channel, command failure.
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

Inject 24.9, 25.0, 25.1 fixed-unit samples; expect no/no/one command.

---

## Expected result

Exact threshold semantics and real relay response.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`relay: evaluate temperature in the runtime thread`

---

## Next task

[TASK-130-07](TASK-130-07-test-the-relay-threshold-and-safe-state.md) — Test the Relay threshold and safe state

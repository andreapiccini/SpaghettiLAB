# TASK-010-02 — Implement Core state and initialization

**Status:** ⬜ TODO  
**Phase:** 010 — Core  
**Depends on:** [TASK-010-01](TASK-010-01-define-the-core-public-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Core state and initialization** and produce this focused outcome:

`0` and READY.

---

## Open

`subsys/core/core.c`.

---

## Write / Modify

Register a Zephyr log module. Implement `spaghetti_core_init()` so it sets the private state to `SPAGHETTI_CORE_READY`, logs `Spaghetti Core ready`, and returns `0`. Implement `spaghetti_core_get_state()` as a read-only getter.

---

## Why

It must link and run before dependencies are added.

---

## Called / used by

`main` and future diagnostics.

---

## Trigger

BOOT.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread/calling thread.

---

## Calls / dependencies

Zephyr logging only.

---

## Inputs

None.

---

## Outputs

`0` and READY.

---

## Errors to handle

None yet; keep an ERROR path ready for future dependencies.

---

## Do NOT implement yet

- Port or service initialization

---

## Zephyr note

Zephyr logging provides compile-time log levels and avoids ad-hoc console output. This ticket only needs one module registration and one readiness message.

---

## Steps

- [ ] Open only `subsys/core/core.c`.
- [ ] Register a Zephyr log module.
- [ ] Implement `spaghetti_core_init()` so it sets the private state to `SPAGHETTI_CORE_READY`, logs `Spaghetti Core ready`, and returns `0`.
- [ ] Implement `spaghetti_core_get_state()` as a read-only getter.
- [ ] Handle only these realistic errors: None yet; keep an ERROR path ready for future dependencies.
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

Static inspection: state is private and getter does not mutate it.

---

## Expected result

Minimal implementation without loops or threads.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`core: implement core state and initialization`

---

## Next task

[TASK-010-03](TASK-010-03-add-core-to-the-application-build.md) — Add Core to the application build

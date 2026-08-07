# TASK-090-05 — Add and apply one hardcoded C config

**Status:** ⬜ TODO  
**Phase:** 090 — Internal Config  
**Depends on:** [TASK-090-04](TASK-090-04-implement-config-apply.md)  
**Estimated scope:** Small

---

## Goal

Complete **Add and apply one hardcoded C config** and produce this focused outcome:

SHT40 instance and real readings.

---

## Open

`CMakeLists.txt` and `subsys/core/core.c` or `src/main.c`.

---

## Write / Modify

Add `subsys/config/config.c` to CMake. Construct one `spaghetti_config` for Port 0, `sht40`, the verified address, and 1000 ms; call `spaghetti_config_apply()` instead of direct Manager configure.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> The hardcoded C snapshot is intentionally temporary and will be removed in [TASK-150-05](../150-cbor/TASK-150-05-apply-cbor-through-communication.md).


---

## Why

It isolates semantic config failures from future decoder failures.

---

## Called / used by

Main/Core test.

---

## Trigger

BOOT TEST.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Config validate/apply -> Manager.

---

## Inputs

Hardcoded internal object.

---

## Outputs

SHT40 instance and real readings.

---

## Errors to handle

Log config validation/apply error distinctly.

---

## Do NOT implement yet

- Encode/decode or storage

---

## Steps

- [ ] Open only `CMakeLists.txt` and `subsys/core/core.c` or `src/main.c`.
- [ ] Add `subsys/config/config.c` to CMake.
- [ ] Construct one `spaghetti_config` for Port 0, `sht40`, the verified address, and 1000 ms
- [ ] call `spaghetti_config_apply()` instead of direct Manager configure.
- [ ] Handle only these realistic errors: Log config validation/apply error distinctly.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Change test period invalid to 0 and verify no Manager call; restore 1000.

---

## Expected result

`Config -> Manager -> Registry -> SHT40` works.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`internal: add and apply one hardcoded c config`

---

## Next task

[TASK-090-06](TASK-090-06-test-config-validation-and-apply.md) — Test Config validation and apply

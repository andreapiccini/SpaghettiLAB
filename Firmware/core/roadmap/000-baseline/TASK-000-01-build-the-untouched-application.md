# TASK-000-01 — Build the untouched application

**Status:** ✅ DONE  
**Phase:** 000 — Baseline  
**Depends on:** None  
**Estimated scope:** Small

---

## Goal

Complete **Build the untouched application** and produce this focused outcome:

`build/zephyr/zephyr.bin` with a successful build.

---

## Open

`Makefile`, `compose.yaml`, `src/main.c` for reading only.

---

## Write / Modify

Nothing.

---

## Why

Every later failure must be distinguishable from environment failure.

---

## Called / used by

Developer workflow.

---

## Trigger

BASELINE CHECK.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

Host invoking Docker Compose.

---

## Calls / dependencies

Existing `make build` target and Docker image.

---

## Inputs

Existing application and board `esp32c3_devkitm/esp32c3`.

---

## Outputs

`build/zephyr/zephyr.bin` with a successful build.

---

## Errors to handle

Missing Docker image/daemon or stale generated build; use
`make image` only if the image is absent, then `make pristine` if needed.

---

## Do NOT implement yet

- Any architecture file

---

## Steps

- [x] Open only `Makefile`, `compose.yaml`, `src/main.c` for reading only.
- [x] Nothing.
- [x] Handle only these realistic errors: Missing Docker image/daemon or stale generated build; use `make image` only if the image is absent, then `make pristine` if needed.
- [x] Confirm no item from **Do NOT implement yet** was added
- [x] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Confirm command exits zero and `build/zephyr/zephyr.bin` exists.

---

## Expected result

`make build` exits successfully and `build/zephyr/zephyr.bin` exists.

---

## Completion checklist

- [x] Required documentation or implementation file changed as specified
- [x] Named type, function, configuration, or test exists
- [x] Build succeeds when this task requires a build
- [x] Task-specific test passes
- [x] No unrelated functionality was added

---

## Commit suggestion

`baseline: build the untouched application`

---

## Next task

[TASK-000-02](TASK-000-02-flash-and-observe-the-baseline.md) — Flash and observe the baseline

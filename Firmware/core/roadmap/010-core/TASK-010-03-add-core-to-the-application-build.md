# TASK-010-03 — Add Core to the application build

**Status:** ⬜ TODO  
**Phase:** 010 — Core  
**Depends on:** [TASK-010-02](TASK-010-02-implement-core-state-and-initialization.md)  
**Estimated scope:** Small

---

## Goal

Complete **Add Core to the application build** and produce this focused outcome:

Core object linked into `zephyr.elf`.

---

## Open

`CMakeLists.txt` and `prj.conf`.

---

## Write / Modify

Add `include` to `target_include_directories(app PRIVATE ...)`, add `subsys/core/core.c` to `target_sources(app PRIVATE ...)`, and enable `CONFIG_LOG=y` without removing existing console options.

---

## Why

Unlisted `.c` files are ignored by CMake.

---

## Called / used by

Zephyr build system.

---

## Trigger

BUILD.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

CMake/Ninja in Docker.

---

## Calls / dependencies

Zephyr application target and logging Kconfig.

---

## Inputs

Existing target plus two new entries.

---

## Outputs

Core object linked into `zephyr.elf`.

---

## Errors to handle

Wrong relative path or include directory.

---

## Do NOT implement yet

- Per-directory CMake/Kconfig

---

## Zephyr note

Kconfig selects software at build time. `CONFIG_LOG=y` compiles Zephyr logging; it is not runtime configuration.

---

## Steps

- [ ] Open only `CMakeLists.txt` and `prj.conf`.
- [ ] Add `include` to `target_include_directories(app PRIVATE ...)`, add `subsys/core/core.c` to `target_sources(app PRIVATE ...)`, and enable `CONFIG_LOG=y` without removing existing console options.
- [ ] Handle only these realistic errors: Wrong relative path or include directory.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine` because `prj.conf` changes.

---

## Flash

NO

---

## Test

Build has no undefined symbol/include error.

---

## Expected result

Successful build with Core compiled but not called.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`core: add core to the application build`

---

## Next task

[TASK-010-04](TASK-010-04-call-core-from-main.md) — Call Core from main

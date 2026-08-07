# TASK-190-01 — Verify controllable power hardware

**Status:** ⬜ TODO  
**Phase:** 190 — Power  
**Depends on:** [TASK-180-07](../180-multi-core/TASK-180-07-build-a-second-core-variant.md)  
**Estimated scope:** Small

---

## Goal

Complete **Verify controllable power hardware** and produce this focused outcome:

Lease/status and reference-counted state.

---

## Open

The real board schematic, Port binding, board DTS, and measured hardware.

---

## Write / Modify

Identify one physically controllable power resource, control polarity, safe boot state, affected Ports, electrical limits, and measurable on/off behavior. If none exists, mark the phase BLOCKED and do not invent one.

---

## Why

Module lifecycle and multi-board static facts are stable.

---

## Called / used by

Manager/driver lifecycle; Communication status.

---

## Trigger

MODULE CONFIGURATION/REMOVAL.

---

## Invocation mechanism

DECISION REQUIRED

---

## Execution context

N/A

---

## Calls / dependencies

None

---

## Inputs

Resource and owner ID.

---

## Outputs

Lease/status and reference-counted state.

---

## Errors to handle

Unsupported resource, transition failure, underflow/double release.

---

## Do NOT implement yet

- Battery policy, deep sleep, speculative wake sources, OTA

---

## Steps

- [ ] Open only The real board schematic, Port binding, board DTS, and measured hardware.
- [ ] Identify one physically controllable power resource, control polarity, safe boot state, affected Ports, electrical limits, and measurable on/off behavior. If none exists, mark the phase BLOCKED and do not invent one.
- [ ] Handle only these realistic errors: Unsupported resource, transition failure, underflow/double release.
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

Ownership/reference-count design review.

---

## Expected result

One real resource is documented, or the phase is explicitly blocked for lack of hardware.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`power: verify controllable power hardware`

---

## Next task

[TASK-190-02](TASK-190-02-define-the-power-public-api.md) — Define the Power public API

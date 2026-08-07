# TASK-070-01 — Declare the Module Manager API

**Status:** ⬜ TODO  
**Phase:** 070 — Module Manager  
**Depends on:** [TASK-060-05](../060-driver-registry/TASK-060-05-test-known-and-unknown-driver-lookup.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare the Module Manager API** and produce this focused outcome:

READY instance and real sample.

---

## Open

`include/spaghetti/module_manager.h`.

---

## Write / Modify

Declare `int spaghetti_module_manager_init(void);`,
`int spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char
*type_id, spaghetti_module_id_t *out_id);`,
`const struct spaghetti_module *spaghetti_module_manager_get_by_port(...)`, and
`int spaghetti_module_manager_read(spaghetti_module_id_t id, struct
spaghetti_sample *out);`.

---

## Why

The Port and Registry are independently proven.

---

## Called / used by

Core/main test; Runtime later.

---

## Trigger

BOOT TEST/MODULE CONFIGURATION/READ REQUEST.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Caller thread.

---

## Calls / dependencies

Port, Registry, driver ops.

---

## Inputs

Port 0, `"sht40"`, output ID/sample.

---

## Outputs

READY instance and real sample.

---

## Errors to handle

Invalid port/type, occupied port, no slot, init/read failure.

---

## Do NOT implement yet

- Remove/replace, mutex, dynamic pool, discovery

---

## Steps

- [ ] Open only `include/spaghetti/module_manager.h`.
- [ ] Declare `int spaghetti_module_manager_init(void);`, `int spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char *type_id, spaghetti_module_id_t *out_id);`, `const struct spaghetti_module *spaghetti_module_manager_get_by_port(...)`, and `int spaghetti_module_manager_read(spaghetti_module_id_t id, struct spaghetti_sample *out);`.
- [ ] Handle only these realistic errors: Invalid port/type, occupied port, no slot, init/read failure.
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

Ownership: CREATED/OWNED/MODIFIED/DESTROYED by Manager.

---

## Expected result

API limited to one configuration case.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: declare the module manager api`

---

## Next task

[TASK-070-02](TASK-070-02-implement-the-one-slot-manager-state.md) — Implement the one-slot Manager state

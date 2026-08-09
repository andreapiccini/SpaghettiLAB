# TASK-010-05 — Structure firmware logging

**Status:** ⬜ TODO
**Phase:** 010 — Core
**Depends on:** [TASK-010-04](TASK-010-04-call-core-from-main.md)
**Estimated scope:** Small

---

## Goal

Replace bootstrap printing with two structured Zephyr log modules and produce
this focused outcome:

Core readiness, application startup, failures, and uptime have an explicit
module and severity.

---

## Open

`Kconfig`, `prj.conf`, `src/main.c`, and `subsys/core/core.c`.

---

## Write / Modify

Create the application `Kconfig` entry point and use Zephyr's
`subsys/logging/Kconfig.template.log_config` to define
`CONFIG_SPAGHETTI_APP_LOG_LEVEL` and `CONFIG_SPAGHETTI_CORE_LOG_LEVEL`. Source
`Kconfig.zephyr` exactly once.

Register `spaghetti_app` in `main.c` and configure the existing
`spaghetti_core` registration with its Core log-level symbol. Replace every
application-owned `printk` with `LOG_ERR` or `LOG_INF`. Remove the direct
`CONFIG_PRINTK=y` selection after confirming no project source still calls
`printk`.

---

## Why

Zephyr logging attaches module, severity, timestamp, filtering, and backend
policy to each message. Direct printing bypasses those controls and makes later
diagnostics inconsistent.

A logger does not replace a function's return value. `main` still needs one
short-lived local result so it can call initialization once, log the exact
failure, and return the same negative errno without hiding control flow.

---

## Called / used by

Zephyr logging frontend and UART backend; developers reading boot diagnostics.

---

## Trigger

BOOT and the temporary uptime loop.

---

## Invocation mechanism

`LOG_MODULE_REGISTER`, `LOG_ERR`, and `LOG_INF`.

---

## Execution context

Main Zephyr thread. Default deferred logging may format/output messages in the
Zephyr logging thread.

---

## Calls / dependencies

Zephyr Logging and the existing `spaghetti_core_init()` call.

---

## Inputs

- Core initialization return value.
- Current uptime from `k_uptime_get()`.
- Per-module compile-time levels selected through Kconfig.

---

## Outputs

- `spaghetti_core` INFO message when Core becomes ready.
- `spaghetti_app` INFO messages for application startup and uptime.
- `spaghetti_app` ERROR message containing the exact negative Core result.

---

## Errors to handle

If `spaghetti_core_init()` returns a negative value, log it once at the
application boundary and return the same value. Do not replace it with `-1`.

---

## Result-variable rule

Use one narrow local variable initialized by the call, for example:

```c
int ret = spaghetti_core_init();

if (ret < 0) {
	LOG_ERR("Core initialization failed: %d", ret);
	return ret;
}
```

The variable exists only because C must retain the single call's result for both
logging and return. It must not become global state, a struct field, or a value
passed through unrelated layers. Do not call initialization twice and do not
introduce a macro that hides the branch.

---

## Log-level rules for this task

| Condition | Level | Example meaning |
|---|---|---|
| Required initialization fails | `LOG_ERR` | Boot cannot continue |
| Core reaches READY | `LOG_INF` | Important lifecycle transition |
| Temporary uptime proof | `LOG_INF` | Expected development observation |
| Internal detail not needed normally | `LOG_DBG` | Not required by this task |

Messages describe the operation and useful value. They do not add manual
timestamps, module prefixes, ANSI colors, or a newline; the backend owns those.

---

## Do NOT implement yet

- Persistent logs, files, network/syslog, MQTT log transport, or custom backend.
- Runtime log-level commands or dynamic filtering UI.
- Generic logging wrappers around `LOG_*`.
- Global `last_error` state or macros that return from the caller.
- Removal of the temporary uptime loop; a later Runtime task owns that change.

---

## Steps

- [ ] Open only `Kconfig`, `prj.conf`, `src/main.c`, and `subsys/core/core.c`.
- [ ] Create one application `Kconfig` that defines App and Core log levels with Zephyr's logging template and sources `Kconfig.zephyr` once.
- [ ] Register `spaghetti_app` and configure `spaghetti_core` with their respective `CONFIG_SPAGHETTI_*_LOG_LEVEL` symbols.
- [ ] Replace application-owned `printk` calls with the correct `LOG_ERR` or `LOG_INF` level.
- [ ] Keep one local initialization result, check `< 0`, log it once, and return it unchanged.
- [ ] Remove `CONFIG_PRINTK=y` only after `rg -n "\\bprintk\\s*\\(" src include subsys spaghetti_modules` finds no project call.
- [ ] Run `make pristine` and compare the result with **Expected result**.
- [ ] Confirm no item from **Do NOT implement yet** was added.

---

## Build

YES — `make pristine` because the application Kconfig entry point and
`prj.conf` change.

---

## Flash

NO — the next task performs the hardware proof.

---

## Test

Inspect the build configuration and source:

```sh
rg -n "CONFIG_SPAGHETTI_(APP|CORE)_LOG_LEVEL" Kconfig build/zephyr/.config
rg -n "\\bprintk\\s*\\(" src include subsys spaghetti_modules
```

The first command finds both configured module levels. The second command
returns no project-owned call. The firmware build completes without an undefined
log symbol.

---

## Expected result

The build succeeds. Boot diagnostics use only `spaghetti_app` and
`spaghetti_core` modules, error paths preserve the original negative errno, and
the validator no longer reports `C010` or `LOG002` for these files.

---

## Completion checklist

- [ ] Application and Core logging levels are configurable through Kconfig.
- [ ] Main contains no `printk` and registers exactly one App log module.
- [ ] Core registers exactly one Core log module.
- [ ] The initialization result is local, checked once, logged once, and returned unchanged on failure.
- [ ] `make pristine` succeeds and the validator logging warnings are resolved.
- [ ] No unrelated logging backend, transport, wrapper, or global error state was added.

---

## Commit suggestion

`logging: structure core boot diagnostics`

---

## Next task

[TASK-010-06](TASK-010-06-define-component-type-and-error-conventions.md) — Define component type and error conventions

# TASK-160-02 — Enable the minimum network Kconfig

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-01](TASK-160-01-choose-the-development-network-path.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable the minimum network Kconfig** and produce this focused outcome:

IP-ready event and address log.

---

## Open

`prj.conf`.

---

## Write / Modify

Enable the installed ESP32 networking options required by the chosen path: Wi-Fi, networking, IPv4, TCP, sockets, net management/events, and DHCP/DNS only when required. Resolve only genuine Kconfig dependencies.

---

## Why

Data works and MQTT is the next external consumer.

---

## Called / used by

MQTT service.

---

## Trigger

BOOT/NETWORK EVENT.

---

## Invocation mechanism

CALLBACK -> K_SEM or K_MSGQ -> THREAD.

---

## Execution context

Net callback signals; MQTT/network worker performs work.

---

## Calls / dependencies

Zephyr Wi-Fi/net management APIs.

---

## Inputs

Credentials supplied by controlled development configuration,
not committed secrets.

---

## Outputs

IP-ready event and address log.

---

## Errors to handle

Auth, association, DHCP, DNS, disconnect/retry.

---

## Do NOT implement yet

- MQTT, TLS, production credential storage

---

## Zephyr note

Network features are selected at build time. Association alone is not proof of usable IP connectivity; wait for the appropriate net-management address event.

---

## Steps

- [ ] Open only `prj.conf`.
- [ ] Enable the installed ESP32 networking options required by the chosen path: Wi-Fi, networking, IPv4, TCP, sockets, net management/events, and DHCP/DNS only when required. Resolve only genuine Kconfig dependencies.
- [ ] Handle only these realistic errors: Auth, association, DHCP, DNS, disconnect/retry.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

NO

---

## Test

Connect, obtain IP, disconnect AP, observe bounded retry/status.

---

## Expected result

Network-ready signal is reliable.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`mqtt: enable the minimum network kconfig`

---

## Next task

[TASK-160-03](TASK-160-03-implement-network-readiness-signalling.md) — Implement network readiness signalling

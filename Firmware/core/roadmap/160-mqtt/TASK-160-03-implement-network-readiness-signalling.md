# TASK-160-03 — Implement network readiness signalling

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-02](TASK-160-02-enable-the-minimum-network-kconfig.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement network readiness signalling** and produce this focused outcome:

IP-ready event and address log.

---

## Open

The network adapter source under `subsys/services/mqtt/`.

---

## Write / Modify

Register the required net-management callbacks, track link/IP state, and signal the future MQTT worker only after `NET_EVENT_IPV4_ADDR_ADD` or the chosen equivalent. Handle disconnect by clearing readiness.

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

## Steps

- [ ] Open only The network adapter source under `subsys/services/mqtt/`.
- [ ] Register the required net-management callbacks, track link/IP state, and signal the future MQTT worker only after `NET_EVENT_IPV4_ADDR_ADD` or the chosen equivalent. Handle disconnect by clearing readiness.
- [ ] Handle only these realistic errors: Auth, association, DHCP, DNS, disconnect/retry.
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

`mqtt: implement network readiness signalling`

---

## Next task

[TASK-160-04](TASK-160-04-define-the-mqtt-service-api.md) — Define the MQTT service API

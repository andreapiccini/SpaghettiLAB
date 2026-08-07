# TASK-160-01 — Choose the development network path

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-150-06](../150-cbor/TASK-150-06-test-valid-and-invalid-cbor-payloads.md)  
**Estimated scope:** Small

---

## Goal

Complete **Choose the development network path** and produce this focused outcome:

IP-ready event and address log.

---

## Open

The target network environment, broker endpoint, credential source, and `subsys/services/mqtt/README.md`.

---

## Write / Modify

Record whether the test uses Wi-Fi, DHCP or static IPv4, DNS or numeric broker address, and how development credentials are supplied without committing secrets. Do not edit firmware in this decision ticket.

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

DECISION REQUIRED

---

## Execution context

N/A

---

## Calls / dependencies

None

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

- MQTT protocol code, production provisioning, TLS, or committed credentials

---

## Steps

- [ ] Open only The target network environment, broker endpoint, credential source, and `subsys/services/mqtt/README.md`.
- [ ] Record whether the test uses Wi-Fi, DHCP or static IPv4, DNS or numeric broker address, and how development credentials are supplied without committing secrets.
- [ ] Do not edit firmware in this decision ticket.
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

`mqtt: choose the development network path`

---

## Next task

[TASK-160-02](TASK-160-02-enable-the-minimum-network-kconfig.md) — Enable the minimum network Kconfig

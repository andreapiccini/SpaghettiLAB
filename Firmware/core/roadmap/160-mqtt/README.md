# Phase 160 — MQTT

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Bring up networking and publish one known temperature stream through a bounded MQTT service.

## Depends on

[Phase 150 — CBOR](../150-cbor/README.md)

## Visible result

One configured temperature topic reaches a broker.

## Tasks

1. ⬜ [TASK-160-01 — Choose the development network path](TASK-160-01-choose-the-development-network-path.md)
2. ⬜ [TASK-160-02 — Enable the minimum network Kconfig](TASK-160-02-enable-the-minimum-network-kconfig.md)
3. ⬜ [TASK-160-03 — Implement network readiness signalling](TASK-160-03-implement-network-readiness-signalling.md)
4. ⬜ [TASK-160-04 — Define the MQTT service API](TASK-160-04-define-the-mqtt-service-api.md)
5. ⬜ [TASK-160-05 — Implement the MQTT worker and client state](TASK-160-05-implement-the-mqtt-worker-and-client-state.md)
6. ⬜ [TASK-160-06 — Queue temperature for a fixed development topic](TASK-160-06-queue-temperature-for-a-fixed-development-topic.md)
7. ⬜ [TASK-160-07 — Integrate and test fixed-topic MQTT](TASK-160-07-integrate-and-test-fixed-topic-mqtt.md)
8. ⬜ [TASK-160-08 — Move MQTT settings into Config](TASK-160-08-move-mqtt-settings-into-config.md)

## Phase completion gate

- [ ] Network IP readiness is separate from MQTT state.
- [ ] Runtime continues when broker is down.
- [ ] Temperature reaches broker.
- [ ] Queue-full/reconnect behavior is observable.
- [ ] Endpoint/topic now come from validated Config.

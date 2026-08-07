# Phase 110 — Data / zbus

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Publish immutable temperature samples to multiple consumers through zbus.

## Depends on

[Phase 100 — Persistent Config](../100-storage/README.md)

## Visible result

One real sample reaches both the logger and a second consumer.

## Tasks

1. ⬜ [TASK-110-01 — Define the temperature sample message](TASK-110-01-define-the-temperature-sample-message.md)
2. ⬜ [TASK-110-02 — Enable zbus message subscribers](TASK-110-02-enable-zbus-message-subscribers.md)
3. ⬜ [TASK-110-03 — Define the temperature channel and subscribers](TASK-110-03-define-the-temperature-channel-and-subscribers.md)
4. ⬜ [TASK-110-04 — Implement Data initialization and publish](TASK-110-04-implement-data-initialization-and-publish.md)
5. ⬜ [TASK-110-05 — Publish real Manager samples](TASK-110-05-publish-real-manager-samples.md)
6. ⬜ [TASK-110-06 — Test zbus fan-out and backpressure](TASK-110-06-test-zbus-fan-out-and-backpressure.md)

## Phase completion gate

- [ ] Data message has explicit ownership and bounded size.
- [ ] Logger receives fake and real samples.
- [ ] Second consumer receives the same sequences.
- [ ] Full-buffer behavior is observed/documented.
- [ ] SHT40 knows nothing about consumers/MQTT.

# Spaghetti LAB firmware backlog

[`IMPLEMENTATION_ROADMAP.md`](../IMPLEMENTATION_ROADMAP.md) is the long-form
technical reference. This directory is the actionable, Jira-like development
backlog derived from it. Open one task at a time and complete its checklist.

## Status legend

| Symbol | Status |
|:---:|---|
| ⬜ | TODO |
| 🟨 | IN PROGRESS |
| ✅ | DONE |
| ⛔ | BLOCKED |

## Task status consistency

Task status is derived from the checkboxes under `## Completion checklist`:

| Completion checklist | Automatic status |
|---|---|
| No item checked | ⬜ TODO |
| Some items checked | 🟨 IN PROGRESS |
| Every item checked | ✅ DONE |

Statuses are edited manually. The validator reads every task during a build and
reports a warning when the status disagrees with `## Completion checklist`. It
never edits a roadmap file. `⛔ BLOCKED` is a deliberate manual exception and
may be used with any incomplete checklist.

Every task must use this future-proof location and identity pattern:

```text
roadmap/<NNN-phase-name>/TASK-<same-NNN>-<NN>-task-name.md
```

The filename ID, `# TASK-NNN-NN` title, and `**Phase:** NNN` metadata must
match. The validator reports an objective `TASK001` error if they diverge and a
non-blocking `TASK002` warning if status and checklist diverge.

[Markdown Checkbox Preview](https://marketplace.visualstudio.com/items?itemName=GSejas.markdown-checkbox-preview)
can still be used to check boxes with the mouse. After checking them, update the
status manually; the next save/build shows any mismatch that remains.

## Phases

| Status | Phase | Visible result |
|:---:|---|---|
| ✅ | [000 — Baseline](000-baseline/README.md) | The existing Zephyr uptime firmware builds, flashes, and prints. |
| 🟨 | [010 — Core](010-core/README.md) | `main` boots through `spaghetti_core_init()` and the console reports Core readiness. |
| ⬜ | [020 — Current board / I2C](020-board-i2c/README.md) | The generated DTS contains the real enabled I2C controller and the firmware still boots. |
| ⬜ | [030 — Port](030-port/README.md) | Port 0 exists, reports I2C capability, and owns a ready Zephyr device. |
| ⬜ | [040 — SHT40 vertical slice](040-sht40/README.md) | Real temperature and humidity values appear in the serial log. |
| ⬜ | [050 — Module + Module Driver](050-module-driver/README.md) | The SHT40 is called only through a module-driver operation table. |
| ⬜ | [060 — Driver Registry](060-driver-registry/README.md) | The `sht40` lookup succeeds and an unknown type fails cleanly. |
| ⬜ | [070 — Module Manager](070-module-manager/README.md) | A Manager call configures Port 0 as SHT40 and reads the real sensor. |
| ⬜ | [080 — Runtime-removable SHT40](080-runtime-removable-sht40/README.md) | The SHT40 remains readable after all static SHT4x shortcuts are removed. |
| ⬜ | [090 — Internal Config](090-config/README.md) | A C configuration applies Port 0, SHT40 address, and the sample period. |
| ⬜ | [100 — Persistent Config](100-storage/README.md) | The internal configuration survives a reboot. |
| ⬜ | [110 — Data / zbus](110-data-zbus/README.md) | One real sample reaches both the logger and a second consumer. |
| ⬜ | [120 — Runtime V0](120-runtime-v0/README.md) | Runtime samples temperature every 1000 ms while `main` only boots Core. |
| ⬜ | [130 — Relay + Runtime V1](130-relay-runtime-v1/README.md) | A temperature above 25 °C commands the configured relay. |
| ⬜ | [140 — Communication](140-communication/README.md) | A local shell command reads status and submits configuration bytes. |
| ⬜ | [150 — CBOR](150-cbor/README.md) | A tiny CBOR payload decodes into `spaghetti_config` and applies. |
| ⬜ | [160 — MQTT](160-mqtt/README.md) | One configured temperature topic reaches a broker. |
| ⬜ | [170 — Discovery](170-discovery/README.md) | Manual discovery feeds the Manager without provider knowledge leaking into it. |
| ⬜ | [180 — Multiple Core variants](180-multi-core/README.md) | Common higher layers build for two Core variants without C3-specific branches. |
| ⬜ | [190 — Power](190-power/README.md) | One power resource transitions correctly under two-owner and rollback tests. |

## Start here

The baseline is complete. Start with
[TASK-010-01 — Define the Core public API](010-core/TASK-010-01-define-the-core-public-api.md).

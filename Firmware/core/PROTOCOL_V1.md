# Protocol V1 — frozen host/firmware contract

[← Documentation index](DOCUMENTATION_INDEX.md) ·
[BLE transport details](subsys/communication/PROTOCOL_V1_BLE.md) ·
[Extending](EXTENDING_SPAGHETTI_LAB.md) ·
[V1 verification](verification/v1/PLATFORM_REPORT.md)

This document freezes **Communication Protocol V1** for Node-RED, the TypeScript
SDK, the Python CLI, and firmware C. After this freeze an incompatible change
requires Protocol V2 or a new schema version. Deleted numeric IDs must never be
reused with a different meaning.

The former BLE-only note lived at `subsys/communication/PROTOCOL_V1.md` and is
now the dedicated BLE annex linked above.

## 1. Numeric operation and event IDs

From `include/spaghetti/protocol.h` (`SPAGHETTI_PROTOCOL_VERSION = 1`):

| ID | Operation |
|---:|---|
| 1 | `GET_CATALOG` |
| 2 | `GET_STATUS` |
| 3 | `APPLY_CONFIG` |
| 4 | `LIST_DISCOVERY` |
| 5 | `SCAN_DISCOVERY` |
| 6 | `ACCEPT_DISCOVERY` |
| 7 | `MODULE_COMMAND` |
| 8 | `GET_UPDATE_STATUS` |
| 9 | `GET_CAPABILITIES` |
| 10 | `GET_CONNECTIVITY_STATUS` |
| 11 | `ACQUIRE_CONNECTIVITY_LEASE` |
| 12 | `RELEASE_CONNECTIVITY_LEASE` |
| 13 | `OPEN_NETWORK_MAINTENANCE` |
| 14 | `OPEN_WIFI_UPDATE` |
| 15 | `FACTORY_RESET` |
| 16 | `GET_CONFIG` |
| 17 | `VALIDATE_CONFIG` |
| 18 | `GET_AUDIT_LOG` |
| 19 | `GET_JOB_STATUS` |
| 20 | `GET_TOPOLOGY` |
| 21 | `GET_RESOURCES` |
| 22 | `LIST_DEVICE_PROFILES` |
| 23 | `GET_DEVICE_PROFILE` |
| 24 | `VALIDATE_DEVICE_PROFILE` |
| 25 | `INSTALL_DEVICE_PROFILE` |
| 26 | `REMOVE_DEVICE_PROFILE` |
| 27 | `GET_FEATURES` |
| 28 | `OPEN_BLE_UPDATE` |
| 29 | `WRITE_BLE_UPDATE` |
| 30 | `FINISH_BLE_UPDATE` |
| 31 | `CANCEL_BLE_UPDATE` |

Public status codes: `OK=0`, `INVALID_ARGUMENT=1`, `UNSUPPORTED=2`,
`UNAUTHORIZED=3`, `CONFLICT=4`, `BUSY=5`, `UNAVAILABLE=6`, `TIMEOUT=7`,
`RESOURCE_EXHAUSTED=8`, `MALFORMED_REQUEST=9`, `INTERNAL_ERROR=10`.

Event types: `RECORD=1`, `STATUS=2`, `DISCOVERY=3`, `CONNECTIVITY=4`.

## 2. CBOR envelope and Config wire version

Request map keys: `0=version`, `1=correlation_id`, `2=operation`, `3=payload` (bstr).

Response map keys: `0=version`, `1=correlation_id`, `2=status`, `3=payload` (bstr).

Absolute payload ceiling: 2048 bytes (`SPAGHETTI_PROTOCOL_PAYLOAD_ABSOLUTE_MAX`).
Profile payload ceiling: `CONFIG_SPAGHETTI_MAX_PROTOCOL_PAYLOAD`.

Config internal model version: `SPAGHETTI_CONFIG_VERSION` (currently 5).
Config CBOR wire: version 2 is current; version 1 (V0) is decoded only by
`config_cbor_legacy.c` until the migration window closes (see file header).

Golden vectors: `tests/protocol/vectors/v1/`.

## 3. MQTT topics

Under `<base>/v1/cores/<core_id>/` where `core_id` is lowercase hex of the 32-byte
device identity:

| Relative topic | Direction | Notes |
|---|---|---|
| `state` | publish | retained QoS 1 |
| `catalog` | publish | retained QoS 1 |
| `modules/<key>/records` | publish | QoS 0 |
| `discovery` | publish | QoS 1 |
| `requests/<client_id>` | subscribe | QoS 1, client_id ≤ 31 chars |
| `responses/<client_id>` | publish | QoS 1 |

Payloads are Protocol V1 CBOR envelopes/events.

## 4. BLE UUID, framing, authentication, limits

See [PROTOCOL_V1_BLE.md](subsys/communication/PROTOCOL_V1_BLE.md) for GATT UUIDs,
challenge/proof, 8-byte fragment header, 2048-byte envelope max, one reassembly
slot, and Record Delivery consumer ID `SPAGHETTI_RECORD_CONSUMER_ID_BLE` (2).

## 5. Schema / field / command ID rules

- Schema IDs are NUL-terminated strings ≤ 31 characters (`SPAGHETTI_SCHEMA_ID_SIZE`).
- Field IDs are nonzero `uint16_t`, stable within a schema version.
- Command IDs are nonzero `uint16_t` within a Module type.
- Drivers own firmware-lifetime descriptors; Registry only enumerates them.
- Incompatible schema changes bump the schema `version`.

## 6. Device ID, boot ID, timestamp, sequence

- `device_id`: immutable 32-byte public identity (Identity subsystem).
- `boot_id`: changes each boot; Record Delivery treats a new value as discontinuity.
- `timestamp_ms`: monotonic uptime from `k_uptime_get()`; restarts after reboot.
- `sequence`: per-source, starts at 1 for each live source epoch.

## 7. Resource profiles, capability, connectivity

Profiles Minimal / Standard / Extended are declared in `Kconfig.resources` and
summarized in `verification/resources/BASELINE.md` and
`verification/v1/RESOURCE_BUDGET.md`. Capability bits are compile-time
(`GET_CAPABILITIES`). Connectivity policies: `LOW_ENERGY`, `ONLINE`, plus bounded
leases. Minimal admits **one** heavy secure session and does **not** compile the
production Remote Console TLS worker.

## 8. Device Profile, acquisition, Block Driver, processing graph

- Device Profiles use declarative opcodes; two profiles may share
  `declarative-device`.
- Installable profiles that use only already-compiled opcodes do not require OTA.
- Block Drivers register via `SPAGHETTI_BLOCK_DRIVER_DEFINE`.
- Graphs are bounded by profile limits (blocks/edges/contexts). Cycles,
  missing blocks, and type-incompatible edges are rejected (`UNSUPPORTED` /
  validation errno mapped to Protocol status).

## 9. Capability Pack, feature-set hash, image manifest, resources

Images declare packs, feature-set hash, and resource budgets in the image
manifest. `GET_FEATURES` / `GET_RESOURCES` expose headroom and high-water.
Updates that remove a capability required by active/persisted Config are
rejected (`SPAGHETTI_CONFIG_MIGRATION_REJECT_REMOVAL` default).

## 10. Topology Flow / Port / Bay, five signals, transport, power

- Each Flow terminates on one Port, exposes five signals, ordered Function Bays.
- Bay `UNSPECIFIED` and rail `UNSPECIFIED` are valid for manual Modules.
- Power admission: `NOT_REQUIRED`, `UNVERIFIED` (unmanaged/jumper), `ENFORCED`
  (switched limits checked). Absent hardware measurement is not simulated PASS.
- One Port has one active transport; shared I2C/SPI/W1 allow multiple owners;
  incompatible transport changes return busy/reject.

## 11. Permission matrix

Adapter permissions are the intersection of principal grants and transport
maximum. BLE max includes `READ | CONFIGURE | COMMAND | DISCOVER`. Revoking a
principal closes matching peers.

## 12. Reset scope and credential lifecycle

Factory reset scopes are Protocol-defined. Maintenance credentials live in PSA
ITS; BLE application auth uses HMAC over challenge nonce + device_id + session.

## 13. Error mapping

Firmware errno is never exposed raw. `spaghetti_protocol_status_from_errno()`
maps to the public status enum above.

## 14. GET / VALIDATE / APPLY Config, generation, CAS

1. Client reads Config + `generation` + hash (`GET_CONFIG`).
2. Optionally `VALIDATE_CONFIG`.
3. `APPLY_CONFIG` compare-and-swap on `expected_generation`.
4. Identical Config is a no-op (no generation bump, no Storage write).
5. Stale generation → `CONFLICT`.

## 15. Principal, replay cache, async jobs, catalog fingerprint

One central replay cache for Protocol requests (adapters do not own a second).
Async jobs return `job_id` and are polled via `GET_JOB_STATUS`. Catalog pages
carry a fingerprint; OTA that changes catalog/feature-set invalidates host cache.

## 16. Lossless INT64 / UINT64 for JavaScript

Values outside JS safe integer range travel as CBOR integers and are represented
in TypeScript/Python with lossless helpers (see SDK and golden vectors
`int64min.json`, `uint64max.json`).

## 17. Backward compatibility and deprecation

- V1 operations/IDs are append-only within V1.
- Legacy Config CBOR V0 / Storage V3 converters remain until the dated removal
  notes in their source files.
- Deprecated MQTT PSK stubs remain labeled `@deprecated` and must not regain
  production semantics.

## 18. Extension procedure (Module, rule, provider, Core, transport)

1. Copy the matching template under `templates/firmware/`.
2. Implement schemas + ops; register with the iterable `*_DEFINE` macro.
3. Add CMake/Kconfig only at the plug-in edge — do **not** patch
   `driver_registry/`, `rule_registry/`, `config/`, `data/`, `runtime/`,
   `communication/`, or `services/mqtt/` for registration.
4. Prove with a test under `tests/` (see `tests/v1_extension/`).
5. New Core boards add DTS/bindings/backends without application branches on
   board name.

## 19. Conformance assets

| Asset | Location |
|---|---|
| Golden vectors | `tests/protocol/vectors/v1/` |
| C envelope pins | `tests/protocol` (`test_envelope_golden_vectors`) |
| Python | `tools/tests/test_protocol_vectors.py` |
| TypeScript | `tools/sdk/typescript/test/vectors.test.ts` |
| Fuzz corpus | `tests/fuzz/` |
| Extension proof | `tests/v1_extension/` |

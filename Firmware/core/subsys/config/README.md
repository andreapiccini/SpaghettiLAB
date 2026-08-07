# Config

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Config owns the validated, versioned desired state of the product and separates
that state from its live application by Module Manager/Runtime.

## Responsibility

Defaults, schema version, validation, migration, snapshot/update, persistence
coordination, and change notification.

## Non-responsibility

No flash driver details, live module lifecycle, discovery probing, or protocol
frame parsing.

## Files

- Public API: `include/spaghetti/config.h`.
- Implementation: `subsys/config/config.c`.
- Physical persistence is delegated to `subsys/services/storage/`.

## Data structures to implement

- `spaghetti_config`: snapshot created from defaults/load/update, owned by Config,
  immutable to readers, replaced atomically by Config.
- schema version/revision: Config-owned monotonic metadata.
- update request: caller-owned during synchronous validation or copied into a
  queue if asynchronous commits are later selected.
- validation error: value object returned to Communication.

## Functions to implement

### `spaghetti_config_init()` / `_load()`

- **Purpose:** create defaults, load persistent records, validate/migrate, commit
  one coherent snapshot.
- **Called by:** Core.
- **Trigger:** firmware boot.
- **Invocation mechanism:** DIRECT CALL; Storage may invoke SETTINGS CALLBACKS.
- **Execution context:** main thread during boot.
- **Inputs:** storage backend/schema version.
- **Outputs:** valid snapshot or controlled default/error.
- **State modified:** active snapshot/revision.
- **Failure cases:** corruption, unsupported version, storage unavailable.
- **Called next:** Storage read, migration/validation by DIRECT CALL.

### `spaghetti_config_update()`

- **Purpose:** validate and persist a new desired-state transaction.
- **Called by:** Communication or local shell/tests.
- **Trigger/mechanism/context:** backend command; COMMUNICATION RX then DIRECT CALL
  in communication worker; asynchronous commit is DECISION REQUIRED.
- **Inputs:** patch/full snapshot and expected revision.
- **Outputs:** new revision or detailed rejection.
- **State modified:** snapshot only after validation/persistence succeeds.
- **Failure cases:** stale revision, schema/type error, storage failure.
- **Called next:** Storage write; then notify Discovery/Runtime/Manager via DIRECT
  reconciliation call or event, DECISION REQUIRED.

### `spaghetti_config_get_snapshot()`

- **Purpose:** provide consistent read-only configuration.
- **Called by:** Discovery, Runtime, MQTT, Communication.
- **Trigger/mechanism/context:** query/reconciliation; DIRECT CALL; caller thread.
- **Inputs:** destination or read guard.
- **Outputs:** copied snapshot/revision.
- **State modified:** none.
- **Failure cases:** invalid destination/not initialized.
- **Called next:** none.

### `spaghetti_config_reset_defaults()`

- **Purpose:** perform an explicit recoverable factory reset transaction.
- **Called by:** authenticated Communication/shell command.
- **Trigger/mechanism/context:** user command; COMMUNICATION RX + DIRECT CALL;
  thread context.
- **Inputs:** authorization/expected revision.
- **Outputs:** status/new revision.
- **State modified:** persistent and active configuration.
- **Failure cases:** unauthorized, write failure.
- **Called next:** Storage and reconciliation.

## Interaction diagram

```text
Core --DIRECT CALL--> Config --DIRECT CALL--> Storage
                              <--SETTINGS CALLBACK-- Zephyr Settings
Backend --COMMUNICATION RX--> Communication --DIRECT CALL--> Config update
Config --DIRECT CALL/event TBD--> Discovery/Manager/Runtime reconciliation
```

## State / lifecycle

```text
DEFAULTS -> LOADING -> VALIDATED -> ACTIVE -> UPDATING -> ACTIVE(new revision)
                    +-> RECOVERED DEFAULTS     +-----> prior ACTIVE on failure
```

## Concurrency considerations

Readers need consistent snapshots; a short mutex plus copy is simplest. Do not
hold it during flash writes or downstream callbacks. Serialize updates. zbus may
announce “config revision changed,” but is not the persistence transaction.

## Zephyr concepts involved

Settings loads key/value records through registered handlers/callbacks. NVS/ZMS
or another backend owns flash layout. A fixed partition belongs in Devicetree.
Kconfig selects Settings/backend software.

## Implementation steps

1. Define one versioned assignment schema.
2. Implement pure validation/defaults.
3. Implement in-memory snapshot/revision.
4. Integrate Storage load/save.
5. Test corruption and stale revision.
6. Add reconciliation notification without holding the Config lock.

## Expected result

Valid desired state survives reboot; invalid/corrupt state has a deterministic
recovery path; failed update never exposes half-applied data.

## Minimal test

Save one port assignment, reboot/load, then inject corruption and stale revision.

## Dependencies

Storage service; stable identifiers/schemas from Port, Discovery, and Runtime.

## Not yet

No secret management, cloud schema, measurement history, or arbitrary blobs.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_config_init/load` | Core | boot | DIRECT CALL + SETTINGS CALLBACK | main thread | Storage/Settings |
| `spaghetti_config_update` | Communication | backend update | COMMUNICATION RX + DIRECT CALL | communication thread | validate, Storage, reconciliation |
| `spaghetti_config_get_snapshot` | subsystems | query | DIRECT CALL | caller thread | none |
| `spaghetti_config_reset_defaults` | Communication/shell | explicit reset | COMMUNICATION RX/SHELL + DIRECT CALL | caller thread | Storage, reconciliation |

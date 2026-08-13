# @spaghettilab/device-profile-authoring-model

Authoring model for a Device Profile (S061): the declarative acquisition plan that lets
a new sensor/actuator be described entirely as data — transactions, byte operations,
CRC, emitted fields — executed by the firmware's single generic `declarative-device`
Module Driver (firmware phase 325, "Profili dispositivo dichiarativi"), never by
writing new firmware code per sensor.

Every type here is sourced directly from
`Firmware/core/include/spaghetti/device_profile.h`,
`Firmware/core/include/spaghetti/port.h`, and `Firmware/core/include/spaghetti/schema.h`
— not invented from the task prose alone. Where the shipped firmware struct is narrower
than the task text or the phase-325 design doc, this package follows the struct, and
says so (see Honest scope gaps below).

## Instructions (`instruction.ts`, `opcodes.ts`, `raw-op.ts`)

`Instruction` is a discriminated union with one typed, named-field variant per opcode in
`enum spaghetti_device_profile_opcode` (22 opcodes: I2C/SPI/UART transactions, GPIO/ADC,
bounded delay/wait, byte manipulation, CRC8/CRC16, EMIT_FIELD/EMIT_RECORD) — ergonomic
for an editor, instead of raw `imm0`-`imm3` slots. `toRawOp()` compiles each variant down
to `RawDeviceProfileOp`, which mirrors `struct spaghetti_device_profile_op` field for
field, using a **fixed per-opcode mapping** grounded in that struct's own per-field and
per-opcode doc comments (e.g. `I2C_READ`: "Read imm0 bytes into temp" → `imm0` is
`length`) — never an arbitrary/configurable formula (S061 point 3).

`MAX_TEMP_SLOTS` (8) mirrors `SPAGHETTI_DEVICE_PROFILE_TEMP_SLOTS`. `WAIT_FIELD_MASK` is
the only looping construct the instruction set has (there is no jump/branch opcode at
all) — `attempts` must be greater than zero, matching the firmware's own `-EINVAL` for a
zero-attempt (unbounded) wait.

## Profile (`profile.ts`, `sample-field.ts`, `transport.ts`)

`DeviceProfileDraft` mirrors `struct spaghetti_device_profile` for every field that
struct actually has: `profileId`/`version` (identity), `transport`/`requiredCapabilities`
(`PortTransport`/`PortCapability`, sourced from `port.h`'s
`spaghetti_port_transport`/`spaghetti_port_capability`), declared budget
(`maxTotalTimeMs`/`maxTransactions`/`maxBytes`), `initOps`/`sampleOps`/`safeStopOps`, and
`sampleSchemaId`/`sampleSchemaVersion`/`sampleFields`. Per that struct's own doc comment,
"Instance Port, Bay, label, and bus address are not part of this object" — those live on
`@spaghettilab/physical-composition-model`'s `ModuleNodeData`
(`portId`/`bayId`/`railId`/`endpoint`), never duplicated here.

`SampleField` mirrors `struct spaghetti_device_profile_field`: `int64`/`uint64` only
("MVP supports INT64 and UINT64 only" per the struct's own comment) — this package does
not offer `bool`/`text`/`bytes` sample fields, matching what the firmware struct
actually has today, not what a future MVP might add.

## Validation (`validate-profile.ts`)

`validateDeviceProfile()` checks a draft the way the firmware's own
`spaghetti_device_profile_validate` would — temp-slot bounds (0-7), unbounded
`WAIT_FIELD_MASK`, duplicate/incoherent sample-field schema (every `EMIT_FIELD` must
reference a declared field; every declared field must be emitted by something), and the
computed budget against the profile's own declared limits — collecting every problem
rather than stopping at the first, matching `@spaghettilab/domain`'s `validateProjectV1`
precedent. On success it returns the computed `DeviceProfileBudget`
(`totalTimeMs`/`transactions`/`bytes`/`operations`), mirroring
`spaghetti_device_profile_validate`'s own `out_budget`, written only on success.

`computeBudget()` uses a **fixed per-opcode formula**, not a simulation: `WAIT_FIELD_MASK`
contributes `attempts` transactions and `attempts * intervalMs` time; only opcodes with
an explicit length operand (`I2C_READ`, `I2C_WRITE_READ`, `SPI_TRANSCEIVE`,
`UART_READ_UNTIL`, plus `LOAD_CONST`'s fixed 8 bytes) contribute to the byte count — a
write-only opcode (`I2C_WRITE`/`UART_WRITE`/`GPIO_SET`) writes whatever a prior opcode
already put in a temp slot, and this package does not simulate per-slot content length to
avoid it (S061 point 3 explicitly rules out "formule JavaScript arbitrarie" —
tracking dynamic slot contents would be exactly that). This is a deliberate,
documented approximation, not a claim of byte-exact accuracy.

`maxOperationCount` is an optional caller-supplied cap:
`CONFIG_SPAGHETTI_MAX_PROFILE_OPERATIONS`/`..._ACQUISITION_OPERATIONS` are Kconfig-tunable
build settings, not wire data, so this package cannot know them without being told.

## Honest scope gaps

- **No `event`/`command` op arrays.** `struct spaghetti_device_profile` as shipped has
  exactly three op arrays: `init_ops`, `sample_ops`, `safe_stop_ops`. The task text and
  firmware phase 325's design prose both mention "evento/command" as a goal, but the
  committed struct doesn't have a separate array for either — this package models only
  what the struct has, not the aspiration.
- **No separate identity-probe field.** Phase 325's design doc mentions an optional
  probe/identification step, but the struct has no dedicated `probe_ops` array either —
  a probe would need to be expressed as ops within `initOps` today.
- **No fixed-point scale/exponent field.** `spaghetti_device_profile_field` carries only
  `field_id`/`type`/`name`/`unit` — a fixed-point conversion is produced by the
  instruction sequence itself (`SHIFT`/`MASK`/etc. before `EMIT_FIELD`), never declared
  as field metadata, so this package doesn't invent one.
- **Byte budget is an approximation**, not exact — see `computeBudget()`'s note above.
- **This package never encodes a draft to the wire CBOR `INSTALL_DEVICE_PROFILE`
  expects.** S061 explicitly excludes import/export/installation ("senza ancora
  occuparsi di import/export o installazione") — that is S062/S063's job.

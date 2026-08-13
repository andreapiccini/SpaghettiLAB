# @spaghettilab/device-profile-package

Local budget check, canonical import/export, and an install-feasibility resolver for a
`DeviceProfileDraft` (S062) — built on `@spaghettilab/device-profile-authoring-model`
(S061). Everything here is computed locally, before any remote `VALIDATE_DEVICE_PROFILE`
or `INSTALL_DEVICE_PROFILE` call (S062 point 1).

## Package (`package.ts`)

`exportProfilePackage(draft, author)` builds a `DeviceProfilePackage`: identity
(`profileId`/`version`), `author`, a content `hash`, `transport`/`requiredCapabilities`
(copied from the draft), and `opcodeDependencies` — computed from the draft's actual
ops (never hand-declared, so it can't drift from the real content).

`hash` is a **local content fingerprint**
(`@spaghettilab/domain`'s `contentHash`, FNV-1a over canonical JSON) — explicitly **not**
the firmware's own SHA-256 over installed CBOR bytes
(`struct spaghetti_device_profile`'s `hash` field, `DeviceProfileSummary.hash` on the
wire). Producing that byte-exact hash needs the CBOR encoder S063 builds; this package
never claims to reproduce it. See `resolver.ts`'s `matchesInstalled` option for how the
resolver stays honest about that gap.

`importProfilePackageJson()` mirrors `@spaghettilab/domain`'s `previewProjectImport`
sandboxing exactly: a byte-length cap checked **before** `JSON.parse` runs, then
structural shape checks, then a content-hash recomputation — a mismatch means the
package's `draft` was edited after export without updating `hash`, and is rejected.
Nothing in this path ever executes, `eval`s, or dynamically imports any part of the
payload, regardless of content — this is the "non eseguire contenuto importato"
guarantee from S062 point 2.

## Resolver (`resolver.ts`)

`resolveProfileInstall()` returns exactly one of the six outcomes S062 point 3 asks for
(`READY`/`PROFILE_INSTALL_REQUIRED`/`FIRMWARE_UPDATE_REQUIRED`/`HARDWARE_INCOMPATIBLE`/
`RESOURCE_INCOMPATIBLE`/`VERSION_CONFLICT`), checked in a fixed priority order — firmware
opcode support, then hardware capability, then installed-profile identity, then resource
capacity — from local data only:

- **`FIRMWARE_UPDATE_REQUIRED`**: any of `pkg.opcodeDependencies` isn't in
  `context.knownOpcodes` (defaults to this closed vocabulary's own opcode set — correct
  as long as the Core runs opcode vocabulary version 1, the only version that exists
  today). `suggestedCapabilityPacks` is populated only from a caller-supplied
  `capabilityPackForOpcode` mapping — the wire has no opcode-to-Capability-Pack index, so
  this is never guessed.
- **`HARDWARE_INCOMPATIBLE`**: `pkg.requiredCapabilities` has a bit `availableCapabilities`
  (caller-resolved, e.g. from `@spaghettilab/physical-composition-model`'s topology data)
  doesn't have. Skipped entirely if `availableCapabilities` is omitted.
- **`READY`/`VERSION_CONFLICT`**: when a `DeviceProfileSummary` with the same id+version is
  already installed, this package cannot itself confirm the content matches (see the
  hash-representation gap above) — a caller-supplied `matchesInstalled` predicate decides.
  Omitting it makes any id+version match resolve to `VERSION_CONFLICT`, never a guessed
  `READY` — the conservative default.
- **`RESOURCE_INCOMPATIBLE`**: `GET_RESOURCES`'s `profiles` pool (`capacity`/`used`) has no
  free slot. Skipped if `resources` is omitted.
- **`PROFILE_INSTALL_REQUIRED`**: none of the above — the normal "call
  `INSTALL_DEVICE_PROFILE` next" outcome.

## Honest scope gaps

- **No firmware SHA-256.** This package's `hash` is a local fingerprint over the
  authoring-side JSON, not the firmware's SHA-256 over installed CBOR bytes — see
  `package.ts`'s `DeviceProfilePackage.hash` doc comment. `resolveProfileInstall`'s
  `matchesInstalled` option exists specifically because of this gap.
- **No opcode-to-Capability-Pack index exists on the wire.** `suggestedCapabilityPacks`
  is only ever as good as the caller-supplied `capabilityPackForOpcode` mapping.
- **This package never produces the wire `profileCbor` bytes** `INSTALL_DEVICE_PROFILE`
  expects — that encoder, and the actual install/catalog wire integration, is S063.

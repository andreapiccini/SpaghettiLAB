# @spaghettilab/system-automation-graph

The System Automation Graph model (S111) — how a cross-Core link is represented,
without generating any real Node-RED node yet. Pure domain: no protocol-sdk, no React,
same "three graphs are pure domain kernel" rule as
`@spaghettilab/device-processing-graph-model`.

## Endpoints (`endpoints.ts`)

Three kinds, matching S111 § Implementazione point 1 exactly: `RecordFieldEndpoint`
(`Core record field`), `CommandEndpoint` (`Core command`), `NodeRedEndpoint` (Node-RED
processing/integration). Every Core-side endpoint references its Core via
`@spaghettilab/domain`'s `CoreBindingId` — a project-stable resource id tied to
`CoreBindingRecord.expectedDeviceId` — **never** a runtime session/connection handle
(`@spaghettilab/core-session`'s session objects are exactly that kind of ephemeral
reference, deliberately unusable here). `sourceKey`/`moduleKey` are the stable
`Config`-assigned keys (`@spaghettilab/config-compiler`'s `assignKeys()`), stable for
the life of a deployed Config. S111 § Verifiche's "un endpoint del grafo referenzia
sempre device ID + stable key, mai un ID di sessione effimero" holds at the type level:
there is no field on any endpoint type that could carry an ephemeral id.

## Field/command registry (`field-registry.ts`) — an honest wire gap

Type/unit metadata for a field or command is never observed on the Protocol V1 wire —
`@spaghettilab/catalog-model`'s own S041 README already documents this: every
operation's schema descriptor is unpopulated. `FieldRegistry` is therefore always
caller-supplied, built from a Device Profile's declared `sampleFields` or a Block/Rule
catalog entry's declared property types — never invented here.

## Compatibility engine (`compatibility.ts`)

`checkFieldCompatibility()` compares `valueType`/`unit`. Any mismatch requires a
non-empty `transformation` string; without one the result is `INCOMPATIBLE`. S111 §
Verifiche: "un link fra schemi con unità incompatibili richiede una trasformazione
esplicita, non converte implicitamente" — this function has no branch that silently
converts a mismatched pair, only one that requires the caller to have already declared
what conversion happens.

## Links (`link.ts`)

`createSystemAutomationLink()` refuses to construct a link at all when endpoints are
incompatible and no transformation was declared, or when the registry can't resolve
either endpoint (`UNKNOWN_FIELD` — never "assume compatible"). A Node-RED
processing/integration endpoint skips the compatibility check on its own side entirely
— it *is* the transformation/integration point, so nothing in the registry needs to
describe it.

## Staleness (`staleness.ts`)

Each `SystemAutomationLink` carries `validatedFingerprints` — the catalog fingerprint
(`GET_CATALOG`'s real `fingerprint`, the same field `@spaghettilab/core-session`'s
`CatalogCache` already keys on) observed for every involved `CoreBinding` at
authoring/last-revalidation time. `revalidateLink()` compares those against a
caller-supplied fresh read and reports `STALE` — naming exactly which Core(s) changed —
the moment any involved Core's fingerprint no longer matches. S111 § Verifiche: "un
catalog change su un Core coinvolto rende stale i link finché non vengono rivalidati."
`markLinkRevalidated()` is the only way a stale link becomes valid again.

## Unified Core catalog (`unified-catalog.ts`)

`UnifiedCoreCatalogEntry` is one entry per `CoreBindingId` known to the project — what a
link author picks endpoints from. This package does no I/O: an app-layer caller builds
each entry from `@spaghettilab/core-session` (reachability) and a Device
Profile/Block-catalog-derived field registry. `toFieldRegistry()` bridges a unified
catalog straight into `createSystemAutomationLink()`'s compatibility check.

## Honest scope gaps

- **No real Node-RED node generation yet** — by design; S111 only defines the
  representation. Real generation/deploy is S112/S113.
- **Field/command type/unit metadata is always caller-supplied** — see
  `field-registry.ts` above; nothing here reads it from the wire because nothing on the
  wire carries it.
- **`toFieldRegistry()`'s cross-catalog lookup is a convenience for authoring UI**, not
  a per-Core-precise resolver — two Cores reusing the same schema/field numbers would
  need `findCoreCatalogEntry()` used directly for exact resolution.

# @spaghettilab/domain

Pure TypeScript domain kernel — see `REACT_FLOW_ARCHITECTURE.md` § Domain Kernel.
**Must never import React, React Flow, a transport library, or any browser API.**
This is enforced by this package having no such dependency in `package.json` (there
is nothing to accidentally `import` — a build step can later add a static check if
this ever needs enforcing at the type level, e.g. via `dependency-cruiser`).

## What's here

### Infrastructure ports (S011)

Abstract ports the rest of the domain depends on instead of talking to the
browser/Node directly:

- `Clock` — current time, so nothing calls `Date.now()` directly.
- `UuidGenerator` — ID generation, so nothing calls `crypto.randomUUID()` directly.
- `Storage` — key/value persistence for authoring data.
- `CredentialStore` — secrets addressed by opaque reference, never by value.
- `Logger` — structured logging (message + context object, not string interpolation).
- `AuditLog` — append-only trail for sensitive operations.

Every port has an in-memory/deterministic fake in `src/ports/fakes/`, used by this
package's own tests and meant to be reused by every other package's tests too — no
test in this workspace should need a browser, a real clock, or a real filesystem.
`FakeUuidGenerator` produces real UUID-shaped strings (deterministic, not random) so
its output round-trips through the branded ID constructors below.

### Result, errors, and branded IDs (S012)

- `Result<T, E>` (`result.ts`) — explicit success/failure. Domain code returns this
  instead of throwing for expected failures (invalid ID, duplicate, dangling
  reference), so failures stay inspectable in tests without try/catch.
- `DomainError` (`errors.ts`) — the one shape every domain failure takes: `code`,
  `severity`, `path`, `target`, `remediation`, optional `cause`. No domain service
  returns a bare string.
- Branded IDs (`ids.ts`) — one nominal string type per entity (`ProjectId`,
  `CoreBindingId`, `ModuleId`, `ProfileId`, `ScheduleId`, `RuleId`, `BlockId`,
  `EdgeId`, `DeploymentId`, `NodeRedResourceId`). A `ModuleId` and a `RuleId` are not
  mutually assignable even though both wrap a UUID string — the compiler rejects the
  mix-up, `tsc -b` fails the build if that guarantee is ever accidentally removed
  (see the `@ts-expect-error` assertions in `src/__tests__/ids.test.ts`). These are
  *authoring-side* IDs, not the short deterministic keys the Config compiler (S072)
  assigns Module/Rule/Block for the firmware wire format — different concept, later
  task.
- `IdRegistry<Id>` (`id-registry.ts`) — the runtime half of "duplicates and dangling
  references are rejected": tracks which IDs of one kind currently exist, rejects
  registering the same ID twice, and fails `resolve()` for an ID that was never
  registered instead of returning `undefined`.

### The three graphs and authoring metadata (S013)

- `GraphLayer` (`graph-layer.ts`) — the three distinct models from
  REACT_FLOW_ARCHITECTURE.md § Tre grafi distinti: `"physical-composition"`,
  `"device-processing"`, `"system-automation"`. They can be shown together in the
  UI but must never share ownership or serialization.
- `Graph<Layer, Id, EdgeId, Data>` (`graph.ts`) — a graph whose nodes/edges all
  belong to exactly one layer. Adding a node/edge tagged with a different layer is
  rejected with a structured `DomainError`
  (`GraphErrorCode.CROSS_LAYER_REFERENCE`) — e.g. a Device Processing → System
  Automation edge is refused, not silently accepted. An edge whose endpoint isn't a
  registered node in *this* graph is rejected too
  (`GraphErrorCode.DANGLING_EDGE_ENDPOINT`). `createPhysicalCompositionGraph`,
  `createDeviceProcessingGraph`, and `createSystemAutomationGraph` are the three
  factories.
- `deployableSnapshot(graph)` — a deterministic, order-independent view of a
  graph's nodes/edges, used to prove authoring metadata changes never affect
  deployable content. Not the canonical Config serialization (S072's job) — a
  domain-level equality check only.
- `AuthoringMetadata` / `AuthoringMetadataStore<Id>` (`authoring-metadata.ts`) —
  position, viewport, selection, comment, group: editor-only data, kept in a
  completely separate store from a graph's nodes. `GraphNode.data` has no field for
  any of this, so there is no path for it to reach a firmware Config — enforced
  structurally, not by convention.

## Commands

```sh
npm run -w @spaghettilab/domain typecheck
npm run -w @spaghettilab/domain lint
npm run -w @spaghettilab/domain test
npm run -w @spaghettilab/domain test:coverage
```

# @spaghettilab/react-flow-adapter

Bidirectional Domain ↔ React Flow adapter (S043). Unlike `@spaghettilab/domain`, this
package is allowed to depend on React and `@xyflow/react` — translating between them
is its entire purpose.

## Read direction — domain → React Flow (`to-react-flow.ts`)

`toReactFlowNodes`/`toReactFlowEdges` convert a persisted `GraphState` into
`@xyflow/react` `Node`/`Edge` objects. Node type is resolved exclusively through
`resolveNodeType()` from `@spaghettilab/editor-model` — this file never `switch`es on
a concrete `typeId` string or imports a per-type component. That is what makes "a new
catalog entry appears in the editor without patching adapter code" true by
construction, and it's what `__tests__/to-react-flow.test.ts` verifies directly: a
type that exists only in a fake, ad-hoc `EditorModel` built inline in the test
resolves correctly with no change to this file.

Position and selection state come from `AuthoringMetadata` only — never from the
domain graph, which has no such fields. An unresolved type never drops the node; it
becomes a `PlaceholderDiagnostic` (S042) carrying the original data.

## Write direction — React Flow → domain commands (`react-flow-events.ts`, `graph-commands.ts`)

`nodeChangesToCommands`/`edgeChangesToCommands` translate `@xyflow/react`'s
`NodeChange[]`/`EdgeChange[]` (from `onNodesChange`/`onEdgesChange`) into
`ProjectCommand`s:

- `position`/`select` changes become `updateAuthoringMetadataCommand` — they never
  touch a graph, and this command cannot fail (S043 § Verifiche: React Flow state —
  position, selection, viewport — is local metadata and never alters the outcome of
  domain validation).
- `remove` changes become `removeGraphNodeCommand`/`removeGraphEdgeCommand`, which do
  go through the domain `Graph`'s own validation (node removal cascades to dependent
  edges via `Graph.removeNodeCascade`, added to `@spaghettilab/domain` in this task).
- `dimensions`/`add`/`replace` changes are React Flow's own rendering bookkeeping and
  are not translated into anything — they carry no domain-meaningful information.

`connectionToCommand` translates an `onConnect` `Connection` into
`addGraphEdgeCommand` — but only after `checkHandleCompatibility()` from
`@spaghettilab/editor-model` passes. Both endpoint handles must be resolvable via a
caller-supplied `resolveHandle` callback; today's `EditorModel` reports no real handle
data yet (an honest gap already recorded in `@spaghettilab/editor-model`'s README), so
`resolveHandle` returning `undefined` for either side means compatibility genuinely
cannot be verified. This adapter rejects rather than optimistically letting an
unverifiable connection through — it will start actually admitting connections once a
real handle-resolution source exists, with no change needed here.

Every graph-editing command (`addGraphNodeCommand`, `addGraphEdgeCommand`,
`removeGraphNodeCommand`, `removeGraphEdgeCommand`) is generic over which graph it
targets via `GraphLens<Layer>` (`graph-lens.ts`): `systemAutomationGraphLens` for the
project's single graph, `deviceGraphLens(index)`/`physicalGraphLens(index)` for the
per-Core arrays in `physicalGraphs`/`deviceGraphs`. Each command reconstructs a
validating `Graph` instance from the lensed `GraphState`, applies the mutation
(reusing `Graph`'s own validation — no separate, looser check for the UI path),
converts back to plain `GraphState`, and returns it as a plain `ProjectCommand`. No
S043-specific `ProjectCommand` subtype was needed: `ProjectCommand`'s existing
contract (`{kind, apply(project): Result<ProjectV1, DomainError>}`, S014) was already
generic enough.

## Scope

- Node/edge `handles`/`propertySchema` are still empty (inherited from
  `@spaghettilab/editor-model`, S042) — connection compatibility checking is wired
  correctly but has nothing real to check against until the wire protocol carries
  handle metadata.
- React Flow node/edge state is never authoritative: it is derived on read from
  `GraphState` + `AuthoringMetadata` every time, and on write it only ever produces
  `ProjectCommand`s that go through the same validation as any other command (S043 §
  Verifiche, both halves).

# @spaghettilab/editor-model

`EditorModel`, form model and compatibility engine (S042) — pure, no React, no I/O.
Built on `@spaghettilab/catalog-model` (S041) and `@spaghettilab/domain`'s
`Result`/`DomainError`.

- `editor-model.ts` — `buildEditorModel(catalog, profiles)`: derives node types from
  S041's normalized indices, never a hardcoded device list.
- `form-model.ts` — `buildFormField`/`buildFormModel`: typed form fields from field
  descriptors, distinguishing required/default, lossless 64-bit integers (S021's
  rule), bytes/text/enum/reference/fixed-point.
- `compatibility.ts` — `checkHandleCompatibility`/`createEdgeIfCompatible`: schema,
  unit, semantic/reference group, direction, an opt-in same-Flow constraint, and
  capability — every rejection is a structured `DomainError`, never a bare boolean.
- `placeholder.ts` — `resolveNodeType`: an unknown type becomes a
  `PlaceholderDiagnostic` that preserves the original data and names a remediation,
  never a dropped node.

Honest scope note: the wire protocol as implemented today only reports
`{typeId, commandCount}` per Module Driver — no per-type handle or property schema
data exists yet (same gap S021's research note and `catalog-model`'s README already
record: every operation's schema descriptor is unpopulated). `buildEditorModel`
therefore produces node types with empty `handles`/`propertySchema` for now — the
shapes and the form/compatibility logic are ready for when that data exists, not
faked in its absence.

See `../../../roadmap/react-flow-v1/tasks/S042-editor-model-compatibility.md`.

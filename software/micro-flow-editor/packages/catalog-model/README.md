# @spaghettilab/catalog-model

Catalog and Topology normalization (S041) — pure functions turning raw, possibly
paginated `@spaghettilab/protocol-sdk` responses (S021) into immutable, order-
independent indices: `CatalogIndex` (Module Driver entries), `ProfileIndex` (Device
Profiles), `CapabilityPackIndex` (Feature Packs), `TopologyIndex` (Flow/Function
Bay/Port/rail). No I/O, no React — this package only reshapes data already read by
`@spaghettilab/core-session` (S030).

Honest scope note: the task calls for normalizing "Module Driver, Rule, Block,
opcode, Profile, operation, schema, field, command e Capability Pack," but the
Protocol V1 wire format as implemented today only exposes Module Driver
(`typeId`/`commandCount`), Profile and Capability Pack data — every operation's
schema descriptor is unpopulated (`.fields = NULL, .field_count = 0`, see S021's
research note), so there is no Rule/Block/opcode/operation/schema/field/command data
on the wire to normalize yet. This package normalizes exactly what's real; it does
not fabricate empty placeholder indices for data that doesn't exist.

Every normalizer takes a `complete: boolean` the caller supplies (did pagination
actually finish?) and carries it through verbatim — an interrupted read is never
allowed to look complete. Rail `assurance`/Bay `admission` values pass through
unchanged — never coerced between `UNVERIFIED` and `ENFORCED`.

See `../../../roadmap/react-flow-v1/tasks/S041-catalog-topology-normalization.md`.

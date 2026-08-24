# @spaghettilab/core-session

Device Session Manager (`REACT_FLOW_ARCHITECTURE.md`) — S030. Owns connection and
synchronization for each Core: the session state machine
(`DISCONNECTED→CONNECTING→AUTHENTICATING→SYNCHRONIZING→READY` and its
validate/apply/update/reboot/trial/error sub-states), a coherent-order sync read
(identity/status/capability/features/catalog/topology/Config/resources), a catalog
cache indexed by device ID + fingerprint (never shared across devices), and the
`IN_SYNC`/`PROJECT_DIRTY`/`DEVICE_CHANGED`/`DIVERGED`/`INCOMPATIBLE` classification
against `DeploymentRecordV1` (S014) — never auto-applied.

Built on `@spaghettilab/protocol-sdk` (S021–S024: `SpaghettiClient`, `EventStream`,
transports) and `@spaghettilab/domain` (`CoreBindingRecord`, `ProjectV1`,
`canonicalProjectHash`).

See `../../../roadmap/react-flow-v1/tasks/S030-core-sessions-sync.md` for the
implementation note, including what's honestly deferred (full `RECONCILE` needs the
Config decompiler, S073; catalog compatibility resolution needs the compatibility
engine, S042 — both not yet built).

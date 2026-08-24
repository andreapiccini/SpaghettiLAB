# @spaghettilab/node-red-deploy

Compiles the System Automation Graph (S111) into a real Node-RED flow, deploys it
through the real Admin API with compare-and-swap, and tracks runtime sync/diagnostics
(S113) — never a full-flows overwrite, never an automatic redeploy, never a duplicated
command from a retried record.

## Flow compiler (`flow-compiler.ts`)

`compileSystemAutomationFlow()` turns a slice of `@spaghettilab/system-automation-graph`
links (S111, already compatibility-checked at authoring time — this function never
re-judges that) into Node-RED flow-JSON nodes: one shared `spaghetti-connection` config
node per distinct `CoreBinding` involved, and a `record source -> coordinator ->
command target` chain per link. Node IDs are `contentHash(...)` of stable identity
inputs (role + link id / CoreBinding) — S113 point 1's "stable node IDs" holds by
construction: recompiling the same links always produces the same ids, never a fresh
random one. Every generated node carries `spaghettiOwned`/`spaghettiProjectId` tags,
which Node-RED itself ignores (unknown node properties pass through untouched) but
`reconcile.ts` reads back.

**Credentials are referenced, never exported**: a connection node only carries a
`connectionProfileId` — a reference into `@spaghettilab/domain`'s `ConnectionProfile`
store, which has no field capable of holding a secret value at all (see that type's own
doc comment). There is nothing in the compiled flow JSON a credential could leak
through.

## Reconciliation (`reconcile.ts`)

`reconcileFlows()` replaces only nodes this project previously owned with the freshly
compiled set — every other node (a user's own flows, another project's nodes, tabs,
subflows) passes through in its original position, untouched. S113 § Verifiche: "un
deploy conserva i flow Node-RED non posseduti dal progetto."

## Admin API (`admin-api.ts`)

`NodeRedAdminApiClient` is a real `fetch`-based adapter — `GET /flows` with the
`Node-RED-API-Version: v2` header (the only version whose response includes `rev`; the
legacy default returns a bare array with nothing to compare-and-swap against), `POST
/flows` with `rev` in the body, `Authorization: Bearer <token>` when `adminAuth` is
configured. **Verified against a real, already-running Node-RED 5.0.4 instance** while
building this package: `GET /flows` with that header genuinely returns `{flows, rev}`,
and `POST /flows` with a stale `rev` genuinely returns `409` before touching anything —
both exactly as this client assumes, confirmed live, not just documented.

## Deploy (`deploy.ts`)

`deployNodeRedFlow()` reads the live flow set, reconciles, and deploys via
compare-and-swap on the `rev` just read. A `rev` that changed underneath surfaces as
`CONFLICT` — this function never re-fetches and retries on its own; that's a caller
decision (who may want to show the user what changed first). S113 § Verifiche: "una
revisione concorrente produce conflict e non sovrascrive silenziosamente."

## Sync classification (`sync-classifier.ts`)

`classifyNodeRedSync()` mirrors `@spaghettilab/core-session`'s
`classifySyncRelationship()` exactly — same five-state `SyncRelationship`
(`IN_SYNC`/`PROJECT_DIRTY`/`DEVICE_CHANGED`/`DIVERGED`/`INCOMPATIBLE`), same
conservative-on-silence stance. S113 point 4: "classifica IN_SYNC/DIVERGED come per
Config" — reuses the type, not a parallel one. "Niente deploy automatico al reconnect"
holds structurally: nothing in this package calls `deployNodeRedFlow()` from a
classification result; deploy is always caller-invoked explicitly.

## Command dedupe (`command-dedup.ts`)

`CommandDedupeTracker` keys on `(linkId, sourceKey, sequence)` — a record redelivered
by a transport-level retry, an at-least-once MQTT bridge, or a reconnect replaying a
small backlog is recognized and skipped, never re-triggering the coordinator's command.
S113 § Verifiche: "un record duplicato/retry non duplica il comando corrispondente."
Bounded (default 1000 entries, oldest evicted first) — never grows unbounded.

## Link diagnostics (`link-diagnostics.ts`)

`LinkDiagnosticsTracker` is a pure in-memory aggregator — source/target connectivity,
last record/command, counts, duplicates — keyed independently per link. S113 point 5:
"Fornisci runtime status del collegamento end-to-end e diagnostica dal record source al
command target." One link's Core going offline never touches another link's entry —
S113 § Verifiche's "broker, Node-RED o Core offline non fermano i runtime locali degli
altri componenti" holds structurally here (independent map entries), and more
fundamentally in `@spaghettilab/node-red-nodes` itself, where each connection is its
own isolated `try`/`catch` around a real wire call.

## Honest scope gaps

- **No live end-to-end scenario exercised** (temperature on Core A reaching a
  display/command on Core B) — no second Core or fake gateway running in this pass;
  the Admin API adapter's real HTTP behavior was verified live, but a full
  record-source → coordinator → command-target round trip against live data was not.
- **This package does not decide *when* to deploy** — no polling, no watch, no
  reconnect-triggered redeploy. A caller wires `classifyNodeRedSync()`'s result into
  whatever UI/flow decides a redeploy is warranted.
- **Backpressure/boot-ID handling is `@spaghettilab/node-red-nodes`'s `EventStream`'s
  job already (S021-S024)** — this package's diagnostics only observes and counts,
  it does not itself buffer or gap-detect.

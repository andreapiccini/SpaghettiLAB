# @spaghettilab/node-red-nodes

Real SpaghettiLAB Node-RED nodes (S112) — connection/config, record source, command
target, status and coordinator — built on the exact same Protocol V1 SDK (S021-S024)
the React Flow app uses, never a second implementation.

## Same SDK, not a parallel one (S112 § Verifiche)

Every node's logic is a thin wrapper around real, already-shipped functions:

- **connection** (`connection.ts`): `createSpaghettiConnection()` builds a real
  `SpaghettiClient` + `EventStream` over one shared `ProtocolTransport` — the identical
  split `@spaghettilab/core-session` uses for the app.
- **record source** (`record-source.ts`): `runRecordSource()` filters the same
  `EventStream` the app's `@spaghettilab/telemetry-buffer` subscribes to, reusing its
  `ResolveFields`/`TelemetryFields` types (never a second field-decoding concept).
- **command target** (`command-target.ts`): `runCommandTarget()` **is**
  `@spaghettilab/core-actions`'s real `runCommand()`, called directly — permission-
  denied/queue-full/timeout classification is identical between Node-RED and the app
  by construction, not by convention.
- **status** (`status-node.ts`): `fetchCoreStatus()` reuses
  `@spaghettilab/core-status`'s real `describeCoreStatus()` for the same enum labels.
- **coordinator** (`coordinator-node.ts`): `coordinateRecordToCommand()` reads a
  `@spaghettilab/system-automation-graph` `SystemAutomationLink` (S111) and applies its
  already-validated `transformation` — it never makes a fresh compatibility judgment of
  its own; that already happened at authoring time in `createSystemAutomationLink()`.

All five are tested directly against `@spaghettilab/protocol-sdk`'s real S024
fixtures (`FakeTransport`, `fakeRecordEvent`, `fakeStatusEvent`, ...) and against the
same request/response round-trip pattern `SpaghettiClient`'s own test suite uses — S112
§ Verifiche's "un nodo record source e un nodo command target funzionano contro le
stesse fixture fake usate da S024" holds literally, not just in spirit.

## WebSocket transport (`ws-connection.ts`)

`software/node-red/BLE_GATEWAY.md` already establishes WebSocket as the real, working
path from Node-RED to a Core — either directly (Wi-Fi) or via the `spaghetti-gateway`
BLE↔WebSocket bridge, which tunnels the exact same framed Protocol V1 bytes.
`wsToRawMessageConnection()` wraps a `ws`-shaped socket into
`@spaghettilab/protocol-sdk`'s `RawMessageConnection` — `protocol-sdk` deliberately
carries no WebSocket library dependency of its own (see `WebSocketProtocolTransport`'s
doc comment); this is the one real transport adapter this package supplies, tested with
a mock socket (no live network in the test suite).

## Node-RED node files (`node-red/`)

Five real node definitions (`.js` + `.html`) following Node-RED's documented ESM node
API (`export default function (RED) { ... }`, matching this package's `"type":
"module"`): `spaghetti-connection` (config node), `spaghetti-record-source`,
`spaghetti-command-target`, `spaghetti-status`, `spaghetti-coordinator`.

## Bundling and real runtime install (S112B)

Every `@spaghettilab/*` package in this workspace resolves via `package.json`'s
`"main": "./src/index.ts"` — fine for this workspace's own TypeScript tooling, but a
plain Node.js runtime (Node-RED's container) cannot `import` a `.ts` file directly.
`npm run build:node-red -w @spaghettilab/node-red-nodes` (`scripts/build-node-red.mjs`,
using `esbuild-wasm` — no native postinstall binary, unlike plain `esbuild`) bundles
each of the five node files, together with the real TypeScript sources of every
`@spaghettilab/*` dependency and `ws`, into one self-contained CommonJS file per node
in `dist-node-red/` (gitignored — regenerate it, don't commit it), plus a minimal
`package.json` with just the `"node-red"."nodes"` manifest — this is what actually gets
mounted into a Node-RED instance, not the workspace `package.json`.

`software/node-red/compose.yaml` bind-mounts `dist-node-red/` straight into
`/data/node_modules/@spaghettilab/node-red-nodes` (read-only) — Node-RED's own startup
scan picks it up, no `npm install` needed inside that container at all.

**Runtime-verified for real** against the already-running `software/node-red`
container (`docker compose up -d` there after building): all five node types load with
no error (`/data/.config.nodes.json` reports `enabled: true` for every one), appear
under a "SpaghettiLAB" palette category with the expected labels/icons, the
`spaghetti-connection` config node's edit dialog and the `record source`/
`command target` edit dialogs render and accept input correctly, a flow using them
deploys successfully, and the connection node's real WebSocket-connecting code runs and
logs a graceful `ECONNREFUSED` (via `node.error()`, not an uncaught exception) against a
nonexistent endpoint — proving the bundle executes, not just loads. "Produce/consume
correct messages" against a real Core or the fake BLE gateway was not exercised (no
gateway/Core running in this pass) — see honest scope gaps below.

## Honest scope gaps

- **End-to-end message flow against a real Core or the fake BLE gateway
  (`software/node-red/BLE_GATEWAY.md`'s `SPAGHETTI_GATEWAY_FAKE=1`) was not
  exercised** — runtime verification confirmed the nodes load, render, deploy, and run
  their real connection code without crashing, not a full record→coordinator→command
  round trip against live data.
- **Only WebSocket is wired** (`ws-connection.ts`) — `ConnectionProfile`'s `mqtt`
  transport kind exists in `@spaghettilab/domain` but has no Node-RED-side adapter
  here yet; `MqttProtocolTransport` (`protocol-sdk`) still needs a real `MqttConnection`
  implementation (e.g. wrapping the `mqtt` npm package) if/when that path is needed.
- **`spaghetti-coordinator`'s link is pasted as JSON**, not picked from a real
  authoring UI — building that UI is System Automation Graph editor territory (beyond
  S112, likely S113 or a dedicated task), not this node package's job.

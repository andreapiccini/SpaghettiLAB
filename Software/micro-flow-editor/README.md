# Micro Flow Editor

A minimal Docker Compose environment running a [React](https://react.dev/) +
[Vite](https://vite.dev/) app with [React Flow](https://reactflow.dev/)
(`@xyflow/react`) wired up, on a placeholder three-node canvas.

This is a first, self-contained step: proof that the stack (Node 24, Vite,
React 19, React Flow) builds and runs in Docker with hot reload. It is
**not yet** the SpaghettiLAB "microcontroller rules" editor — no custom
block types (Read Sensor, Wait, Publish MQTT, ...), no compiler that turns
the graph into a device config, no AppBlocks-inspired visual design, no
connection to the firmware. Those are separate, later tasks, planned once
this base is confirmed working.

## Why this exists

Node-RED (see [`../node-red`](../node-red)) stays the server-side engine —
MQTT, integrations, automation logic that runs continuously on the host.
This app is for a different job: a purpose-built editor for describing
device behavior as a block graph that gets *compiled* into a config the
firmware runs on its own, independent of whether the server is even
reachable. React Flow was chosen over reshaping Node-RED's own canvas
because Node-RED's editor isn't built to be replaced at that level (see the
project discussion this came out of) — full write-up pending in a future
architecture doc.

## Requirements

- Docker Desktop (macOS, Windows) or Docker Engine + Compose plugin (Linux)
- No local Node.js installation needed — everything runs in the container

## Start it

```sh
cd Software/micro-flow-editor
docker compose up -d
```

First start builds the image (installs npm dependencies inside the
container) and can take a minute or two. Subsequent starts are fast.

## Open the editor

```text
http://127.0.0.1:5173
```

Published on `127.0.0.1` (loopback) only, same policy as the Node-RED
environment — reachable from this computer, not from other devices on the
LAN.

## Development workflow

Source code (`src/`, `index.html`, config files) is bind-mounted into the
container, and the Vite dev server watches it — edit files on the host with
your normal editor, save, and the browser hot-reloads. `node_modules` lives
in its own named Docker volume (`micro-flow-editor-node-modules`), kept
separate from the host filesystem so host/container platform differences
(e.g. native dependencies) don't collide.

Adding or updating a dependency (`package.json` change) requires rebuilding
the image so `npm install` re-runs:

```sh
docker compose up -d --build
```

## Check status and logs

```sh
docker compose ps
docker compose logs -f micro-flow-editor
```

## Stop it

```sh
docker compose stop
```

Keeps the container and the `node_modules` volume. To remove the
container too (volume still preserved):

```sh
docker compose down
```

To also wipe the installed-dependencies volume (forces a clean reinstall
next start):

```sh
docker compose down -v
```

## Changing the port

Copy `.env.example` to `.env` and edit:

```sh
cp .env.example .env
```

```text
MICRO_FLOW_EDITOR_PORT=5173
```

Then `docker compose up -d`.

## Scope of this version

Included: a working React + React Flow canvas in Docker, with placeholder
nodes, proving the stack runs end to end.

Not included yet: SpaghettiLAB-specific block types, the graph-to-firmware
compiler, AppBlocks-style visual design, any connection to the Node-RED
side or the firmware. These will be scoped as separate tasks once this
base is confirmed working.

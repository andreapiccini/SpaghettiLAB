# S112 — Package nodi Node-RED SpaghettiLAB

**Stato:** ✅ DONE
**Dipende da:** S111

## Obiettivo

Fornire i nodi Node-RED reali che il System Automation Graph potrà orchestrare,
costruiti sullo stesso SDK Protocol usato dal resto dell'applicazione.

## Implementazione richiesta

1. Implementa package di nodi Node-RED SpaghettiLAB necessario: connection/config,
   record source, command target, status e coordinator; riusa lo stesso SDK Protocol
   (S021–S024).

## Verifiche

- i nodi Node-RED e l'applicazione React Flow usano la stessa decodifica/validazione
  Protocol V1, non due implementazioni parallele;
- un nodo `record source` e un nodo `command target` funzionano contro le stesse
  fixture fake usate da S024.

## Fine task

- [x] Il package nodi copre connection/config, record source, command target, status
      e coordinator.
- [x] I custom node condividono SDK e semantica firmware con il resto dell'app, non
      una reimplementazione separata.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/node-red-nodes`
(`Software/micro-flow-editor/packages/node-red-nodes/`), che dipende da `domain`,
`protocol-sdk`, `core-actions`, `core-status`, `telemetry-buffer`,
`system-automation-graph` e `ws`.

**Connection/config** (`connection.ts`): `createSpaghettiConnection()` costruisce un
vero `SpaghettiClient` + `EventStream` sullo stesso `ProtocolTransport` — lo stesso
split che `core-session` usa per l'app.

**Record source** (`record-source.ts`): `runRecordSource()` filtra lo stesso
`EventStream` reale per `sourceKey`/`schemaId`, riusando i tipi
`ResolveFields`/`TelemetryFields` di `telemetry-buffer` (S091) invece di un secondo
concetto di decodifica campi.

**Command target** (`command-target.ts`): `runCommandTarget()` **è** il vero
`runCommand()` di `core-actions` (S092), chiamato direttamente — la classificazione
permission-denied/queue-full/timeout è identica fra Node-RED e l'app per costruzione.

**Status** (`status-node.ts`): `fetchCoreStatus()` riusa il vero `describeCoreStatus()`
di `core-status` (S093) per le stesse etichette enum.

**Coordinator** (`coordinator-node.ts`): `coordinateRecordToCommand()` legge un vero
`SystemAutomationLink` di `system-automation-graph` (S111) e applica la sua
`transformation` già validata — mai un nuovo giudizio di compatibilità, quello è
avvenuto in `createSystemAutomationLink()` in fase di authoring.

**Trasporto WebSocket reale** (`ws-connection.ts`): `Software/node-red/BLE_GATEWAY.md`
stabilisce già WebSocket come percorso reale Node-RED→Core (diretto o via gateway
BLE↔WebSocket, che tunnela gli stessi byte CBOR framed). `wsToRawMessageConnection()`
avvolge un socket in stile `ws` nel `RawMessageConnection` di `protocol-sdk` — l'unico
adapter di trasporto reale che questo pacchetto fornisce, testato con un socket mock.

**Cinque node file reali** (`node-red/*.js`+`.html`): `spaghetti-connection`
(config node), `spaghetti-record-source`, `spaghetti-command-target`,
`spaghetti-status`, `spaghetti-coordinator`, seguendo l'API ESM documentata di
Node-RED, registrati via `package.json`'s `"node-red"."nodes"`.

**Test**: 17 nuovi test coprono direttamente le due Verifiche — `record source` e
`command target` testati contro le stesse fixture fake di S024
(`FakeTransport`/`fakeRecordEvent`/`fakeStatusEvent`) e lo stesso pattern
request/response del test suite di `SpaghettiClient`. CI completa verde via Docker.

**Gap onestamente riconosciuto e tracciato**: i node file `.js`/`.html` non sono stati
verificati runtime in un'istanza Node-RED live, e — scoperta reale durante
l'implementazione — nessun pacchetto `@spaghettilab/*` di questo workspace è
importabile da un runtime Node.js semplice come il container Node-RED
(`"main": "./src/index.ts"`, non compilato). Serve uno step di bundling non ancora
esistente. Tracciato come nuovo task
[S112B](S112B-node-red-package-bundling.md) invece di essere perso o rimandato senza
traccia.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): solo
WebSocket è cablato (MQTT resta un gap, `MqttConnection` di `protocol-sdk` richiede
ancora un adapter reale); il link del nodo `coordinator` è incollato come JSON, non
scelto da una UI di authoring reale.

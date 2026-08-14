# UI-S110 — Cross-Core Automation

[← Roadmap](../README.md) · [UX-S110](../../ux-v1/tasks/UX-S110-cross-core-automation.md) ·
[visual.md](../../../ux/screens/S110-cross-core-automation/visual.md) ·
[ui-behavior.md](../../../ux/screens/S110-cross-core-automation/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S110-cross-core-automation/backend-behavior.md)

**Stato: ✅ DONE**

Tre tab (Grafo/Deploy Node-RED/Diagnostica) per collegare record field e comandi di
Core distinti tramite Node-RED, cablati su `@spaghettilab/system-automation-graph`
(S111), `@spaghettilab/node-red-nodes` (S112) e `@spaghettilab/node-red-deploy`
(S113) — tutti reali, contrariamente alla nota "⬜ TODO" stantia del
`backend-behavior.md` di questa schermata (scritto prima che il backend fosse
costruito, stesso pattern già visto per ogni screen precedente tranne S104). A
differenza di `ota-preflight`, `@spaghettilab/node-red-deploy`'s
`NodeRedAdminApiClient` fa vere chiamate HTTP `fetch` verso un'istanza Node-RED
reale — verificato dal vivo: il tab Deploy ha effettivamente raggiunto un'istanza
Node-RED reale su `localhost:1880` (bloccata solo da CORS lato server, non un bug
di questa app).

## Implementazione

- `node-data.ts` — `CrossCoreNodeData`, estende i tre `SystemAutomationEndpoint`
  di `system-automation-graph` con `label`/`valueType`/`unit` autorati (nessun
  catalogo esiste per popolare questi campi da un wire reale, stesso gap già
  documentato per Runtime & Diagnostics' Comandi tab).
- `core-palette.ts` — rotazione fissa a 6 colori (`ux/screens/S110-.../visual.md`
  § Palette Core), assegnati in ordine `coreBindings`.
- `CrossCoreNode.tsx`/`to-nodes.ts` — nodo React Flow singolo con badge
  tipo/colore Core, handle sorgente/destinazione in base al kind (record-field
  solo output, command solo input, nodered entrambi).
- `NodeCreateDialog.tsx` — form manuale (nessun catalogo record-field/comando
  da cui scegliere) per i tre kind.
- `GraphTab.tsx` — canvas reale (`@xyflow/react`, stesso pattern di Physical
  Composition/Processing Graph), persistito in `ProjectV1.systemAutomationGraph`
  via `systemAutomationGraphLens`/`addGraphNodeCommand`/`addGraphEdgeCommand`
  (già pronti in `react-flow-adapter`, mai usati prima da nessuno screen — S110 è
  il primo chiamante reale). `onConnect` chiama `checkFieldCompatibility()`
  reale; su esito incompatibile chiede una trasformazione esplicita prima di
  creare il link (mai una conversione implicita, S111 § Verifiche). Link non
  rivalidati mostrati con badge + azione "Rivalida" (`revalidateLink`/
  `markLinkRevalidated`, reali).
- `DeployTab.tsx` — banner di scope, diff calcolato a livello app (nessun tipo
  diff dedicato nel pacchetto) confrontando nodi posseduti prima/dopo
  `reconcileFlows()`, badge sync (`classifyNodeRedSync`), "Invia a Deploy"
  chiama `deployNodeRedFlow()` reale (HTTP verso l'Admin API Node-RED).
- `DiagnosticsTab.tsx` — breadcrumb strutturale per ciascun link (endpoint,
  compatibilità) — vedi gap sotto per i conteggi eventi live.
- `link-meta.ts` — `AppLink`/`LinkMeta`: la parte di `SystemAutomationLink`
  (`transformation`/`validatedFingerprints`) che `GraphEdge` non ha campi per
  persistere, tenuta in stato React sollevato a livello screen.

## Gap dichiarati

- **`transformation`/`validatedFingerprints` di un link non sono persistiti in
  `ProjectV1`.** `GraphEdge` (`domain/src/graph.ts`) ha solo
  `{layer, id, source, target, sourceHandle?, targetHandle?}`, nessun campo
  `data` generico come i nodi. Restano in stato React locale (`linkMeta`) — un
  ricaricamento del progetto perde trasformazione e fingerprint validati, e ogni
  link ricaricato appare "non rivalidato" finché non lo rivalidi di nuovo.
  Estendere `GraphEdge` con un campo `data` generico è un cambiamento
  cross-cutting (tocca anche Physical Composition/Processing Graph) fuori
  scopo per questo task.
- **Il tab Diagnostica non mostra eventi/log live.** Gli eventi di runtime
  (record ricevuti, comandi instradati, `LinkDiagnosticsTracker` di
  `node-red-deploy`) sono generati **dentro** un'istanza Node-RED in esecuzione
  dai nodi di `@spaghettilab/node-red-nodes` — non esiste alcun canale
  (WebSocket, polling, ecc.) che porti quegli eventi da Node-RED a questa app
  browser. Il breadcrumb mostra quindi solo struttura/compatibilità, sempre
  disponibili localmente, mai conteggi che resterebbero fuorviantemente a zero.
- **Nessun tipo "diff" dedicato esiste in `node-red-deploy`** — solo
  `reconcileFlows()` (riconciliazione, non un oggetto diff). La tabella diff del
  tab Deploy è ricostruita a livello app confrontando gli id dei nodi posseduti
  (`spaghettiOwned`+`spaghettiProjectId`) prima/dopo.
- **`classifyNodeRedSync()` riceve sempre `lastDeployedFlowHash: null`** —
  nessun campo `ProjectV1` persiste l'ultimo hash di flow deployato con
  successo (a differenza di `deploymentRecords` per il Config Core), quindi la
  classificazione non può mai distinguere "mai deployato" da "questo progetto
  non ricorda l'ultimo deploy" nella sessione corrente.
- **Nessun catalogo di record field/comandi da cui scegliere** — stesso gap già
  documentato per Runtime & Diagnostics' Comandi tab (`GET_FEATURES` non
  riporta mai i typeId reali). Ogni nodo record-field/command richiede identità
  wire inserita manualmente.
- **Verifica dal vivo limitata dall'assenza di un Core reale raggiungibile** in
  questo ambiente sandboxed (stesso limite di ogni screen precedente): il tab
  Grafo è stato verificato creando un nodo Node-RED reale (persistito via
  `CommandStack`, nessun crash) — creare nodi record-field/command richiede
  almeno un Core nel progetto, non disponibile qui. Il tab Deploy ha
  effettivamente raggiunto un'istanza Node-RED reale su `localhost:1880`
  (bloccata da CORS, non un bug di questa app) — la chiamata HTTP stessa
  funziona. Il tab Diagnostica verificato con lista vuota.

## Verifica

- `docker compose run --rm micro-flow-editor npm run typecheck` — verde.
- `docker compose run --rm micro-flow-editor npm run -w @spaghettilab/app lint` —
  verde (0 errori, solo warning pre-esistenti + uno stesso-pattern già tollerato
  altrove in `core-sessions-context.tsx`).
- `docker compose run --rm micro-flow-editor npm run -w @spaghettilab/app build` —
  verde.
- Verificato dal vivo nel browser: navigazione dal command palette (schermata
  visibile solo in modalità avanzata), creazione di un nodo Node-RED reale nel
  tab Grafo (persistito, "1 nodi" nel contatore header), tab Deploy Node-RED con
  chiamata HTTP reale verso Node-RED (CORS-bloccata ma genuinamente tentata),
  tab Diagnostica con stato vuoto — nessun errore console (a parte l'errore CORS
  atteso, non un bug applicativo).

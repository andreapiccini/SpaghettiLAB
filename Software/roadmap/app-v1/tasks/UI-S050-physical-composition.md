# UI-S050 — Physical Composition Editor

[← Roadmap](../README.md) · [UX-S050](../../ux-v1/tasks/UX-S050-physical-composition.md) ·
[visual.md](../../../ux/screens/S050-physical-composition/visual.md) ·
[ui-behavior.md](../../../ux/screens/S050-physical-composition/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S050-physical-composition/backend-behavior.md)

**Stato: ✅ DONE**

Editor con canvas React Flow per la composizione fisica di un Core — Backbone,
Power, Connector, Dispositivo esterno, Module — cablato su
`@spaghettilab/physical-composition-model` (S050, reale, contrariamente alla nota
"⬜ TODO" nel `backend-behavior.md` di questa schermata, scritta prima che il
backend fosse costruito).

## Implementazione

- `packages/app/src/components/physical-composition/node-kinds.ts` — icona/colore
  per i cinque tipi di nodo reali.
- `to-nodes.ts` — conversione diretta `GraphState<"physical-composition">` → nodi
  React Flow (non `react-flow-adapter`'s `toReactFlowNodes()`, vedi gap sotto).
- `PhysicalNode.tsx` — anatomia nodo standard (barra laterale 3px, chip icona,
  titolo/sottotitolo), nessun handle di connessione (vedi gap).
- `NodeInspector.tsx` — form per tutti e cinque i tipi; per Module: Driver (select
  dal catalogo se disponibile), Profile (select), Port/Bay/Rail (select dalla
  `TopologyIndex` reale del Core connesso), Indirizzo/Chip-select, Modalità
  elettrica, banner di collisione (via `validateComposition`, calcolato client-side
  sui dati già in memoria — nessuna chiamata di rete per questo controllo, coerente
  con `backend-behavior.md`: "dipende dallo stato... non una verifica isolata"),
  checkbox di acknowledgement per rail passive (`requiresPowerAcknowledgement`).
- `DiscoveryTray.tsx` — tray dei candidati reali (`CoreSession.listDiscoveryCandidates()`,
  nuovo), preview/diff via `previewDiscoveryAccept`/`previewDiscoveryAcceptDiff`,
  accept invia `ACCEPT_DISCOVERY` reale (`CoreSession.acceptDiscovery()`, nuovo) e
  applica il Module risultante via `addGraphNodeCommand`; reject non ha alcun
  effetto collaterale (nessun comando registrato), come richiesto.
- `PhysicalCompositionScreen.tsx` — header (selettore Core, badge candidati/
  collisioni, "Invia a Deploy" → naviga a `deploy-diff`), toolbar "+ tipo", canvas,
  status bar con content hash (vedi gap "hash compilato").
- `core-session`: aggiunti `CoreSession.listDiscoveryCandidates()` e
  `.acceptDiscovery()` (stesso pattern di `listDeviceProfiles()` da UI-S040).
- `core-sessions-context.tsx`: esposti `listDiscoveryCandidates`/`acceptDiscovery`.
- `domain/src/graph.ts`: aggiunto `Graph.updateNode()` — mancava un modo per
  modificare i dati di un nodo esistente senza rimuoverlo e ricrearlo (che avrebbe
  fatto cascata sugli edge collegati per nessun motivo di dominio).
- `react-flow-adapter/src/graph-commands.ts`: aggiunto `updateGraphNodeCommand()`
  sopra `Graph.updateNode()` — necessario per "Salva" nell'Inspector su un nodo
  esistente (`backend-behavior.md` punto 2: "Salvataggio → comando... che
  crea/aggiorna il Module").

## Bug reali risolti mentre si cablava questa schermata

1. **`addCoreBinding`/`removeCoreBinding` non mantenevano `physicalGraphs`/
   `deviceGraphs` allineati per indice a `coreBindings`.** `physicalGraphLens(index)`/
   `deviceGraphLens(index)` (`react-flow-adapter`, S043) assumono esplicitamente
   questo allineamento ("matched by array index", commento già presente nel
   codice) ma **nulla lo manteneva**: `addCoreBinding` aggiungeva solo a
   `coreBindings`, lasciando `physicalGraphs`/`deviceGraphs` vuoti — aprire questa
   schermata per qualunque Core Binding esistente avrebbe fatto crashare
   `physicalGraphLens(0).get()` su `undefined`. Bug bloccante, non un gap
   documentabile: corretto in `domain/src/commands.ts`, `addCoreBinding` ora
   aggiunge anche un `GraphState` vuoto a entrambi gli array, `removeCoreBinding`
   li rimuove allo stesso indice. Test aggiunto in `commands.test.ts`. Un
   meccanismo di riparazione lazy in `PhysicalCompositionScreen.tsx` (dispatcha un
   comando ad-hoc che completa gli array mancanti) copre anche i progetti già
   persistiti prima di questo fix — verificato dal vivo: il progetto "Test"
   esistente (Core Binding creato in UI-S030, prima di questo fix) si apre senza
   errori.
2. **Nessun modo di modificare i dati di un nodo esistente** — `graph-commands.ts`
   aveva `addGraphNodeCommand`/`removeGraphNodeCommand` ma non un equivalente
   "update", quindi salvare l'Inspector su un Module già esistente non era
   possibile senza distruggere e ricreare il nodo (perdendo qualunque edge
   collegato per una cascata senza motivo di dominio). Corretto con
   `Graph.updateNode()` + `updateGraphNodeCommand()`, entrambi testati.

## Gap onesti (non risolti in questo task)

- **Solo cinque tipi di nodo esistono davvero**, non sei: `visual.md` elenca anche
  "Core" e "Function Bay" come tipi di nodo separati, ma
  `PhysicalCompositionNodeData` (`physical-composition-model`) non li include — il
  Core è implicito (selezionato nell'header, stesso pattern di UI-S040), una
  Function Bay è solo un `bayId` numerico referenziato dai campi di un Module, mai
  una propria entità di authoring. Questa schermata mostra i cinque tipi reali.
- **Nessuna creazione di cablaggio (edge) fra nodi** — `connectionToCommand`
  (`react-flow-events.ts`) richiede `HandleDescriptor` per entrambe le estremità,
  ma nessun tipo qui ne ha uno (stesso gap già documentato per UI-S040/UI-S030:
  `EditorModel`'s `handles` sono sempre vuoti). Un canvas che permettesse di
  iniziare un trascinamento di connessione che non può mai avere successo sarebbe
  peggio di uno che non lo offre — nessun handle è renderizzato.
- **Nessun badge "authority"** nel tray discovery (es. "dichiarato dal Core" vs
  "euristica") — `DiscoveryCandidate` ha solo `confidence: number`, nessun campo
  di questo tipo esiste sul wire.
- **L'acknowledgement per rail passive non è persistito nel progetto** — resta
  stato locale del componente (si perde al refresh). `backend-behavior.md` stesso
  dichiara che "natura e superficie esatta dell'acknowledgement sono definite
  dall'implementazione di S050" senza specificare un meccanismo di persistenza, e
  nessun campo in `ProjectV1`/`AuthoringMetadata` esiste per questo — non inventato
  qui.
- **"Hash compilato" nello status bar non è il vero Config hash compilato** (quello
  richiede il Config compiler, S072, non collegato a nessuna schermata) — mostrato
  invece un `contentHash` del `deployableSnapshot` del grafo stesso, reale e
  sufficiente a garantire il vero requisito della spec ("cambiare label/posizione
  non cambia questo hash", verificato dal vivo), ma dichiarato esplicitamente come
  non l'artefatto compilato.
- **Form Module senza campi schema-driven aggiuntivi** — `propertySchema` di
  `NodeTypeDescriptor` è sempre vuoto oggi (stesso gap già documentato per
  UI-S040/UI-S030: il protocollo non espone ancora descrittori di schema per
  driver) — l'Inspector mostra solo i campi reali del dominio (Driver/Profile/
  Port/Bay/Rail/Indirizzo/Modalità elettrica), nessun campo aggiuntivo fabbricato.
- **Test discovery/Module con topologia reale non verificati dal vivo** — nessun
  Core reale è raggiungibile in questo ambiente sandboxed. Verificato dal vivo:
  creazione/modifica/eliminazione di nodi Backbone (unico tipo utilizzabile senza
  topologia), drag con posizione non persistita nel content hash, undo/redo,
  salvataggio esplicito (`⌘S`) e persistenza attraverso un reload completo, e il
  meccanismo di riparazione per progetti pre-esistenti con array disallineati. La
  logica di validazione/discovery per Module reali è stata verificata solo per
  lettura del codice + gli unit test già esistenti di `physical-composition-model`
  (non riscritti qui).

## Verifica

- `docker compose run --rm micro-flow-editor npm run ci` — verde (typecheck, lint
  0 errori/5 warning pre-esistenti, test — inclusi i nuovi test di
  `CoreSession.listDiscoveryCandidates()`/`.acceptDiscovery()` in `core-session`,
  `Graph.updateNode()` in `domain`, `updateGraphNodeCommand()` in
  `react-flow-adapter`, `addCoreBinding`/`removeCoreBinding` in `domain` — build).
- Verificato dal vivo nel browser (Docker dev server, porta 5173, tab pulita senza
  cronologia HMR stantia):
  - Apertura della schermata su un progetto con un Core Binding creato prima del
    fix di allineamento — nessun crash, riparazione lazy applicata.
  - "+ Backbone" nella toolbar → Inspector con i campi reali (Nome, Variante) →
    Salva → nodo compare sul canvas, contatore/hash aggiornati.
  - Drag del nodo → posizione aggiornata, **content hash invariato**.
  - Click sul nodo → Inspector si apre in modalità modifica con i valori esistenti
    precompilati, pulsante "Elimina" presente.
  - Undo/redo attraverso la top bar condivisa — ripristinano esattamente
    posizione/stato.
  - `⌘S` → reload completo della pagina → nodo, etichetta, posizione e content
    hash tutti ancora presenti (round-trip reale via `localStorage`).

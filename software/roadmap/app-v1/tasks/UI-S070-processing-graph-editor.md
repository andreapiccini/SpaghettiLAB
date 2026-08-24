# UI-S070 — Processing Graph Editor

[← Roadmap](../README.md) · [visual.md](../../../ux/screens/S070-processing-graph-editor/visual.md) ·
[ui-behavior.md](../../../ux/screens/S070-processing-graph-editor/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S070-processing-graph-editor/backend-behavior.md)

**Stato: ✅ DONE**

Editor del comportamento locale bounded di un Core (Schedule/Event source/Block/Rule),
cablato su `@spaghettilab/device-processing-graph-model` (S071),
`@spaghettilab/config-compiler` (S072), `@spaghettilab/config-decompiler` (S073) —
tutti reali. Questa schermata non ha un proprio task in `roadmap/ux-v1/tasks/`: le sue
specifiche (`ux/screens/S070-processing-graph-editor/`) sono il prototipo React
originale confermato dal product owner il 12/08/2026, la base da cui sono state
derivate tutte le altre specifiche `ux-v1` — non un file mancante.

## Un chiarimento fondamentale prima dell'implementazione

Il prototipo "as-built" usa dati **esplicitamente finti**, dichiarati tali nel proprio
testo: "Set di blocchi placeholder (11, tutti finti)", "Matrice di compatibilità
(finta, solo per l'anteprima)", campo Sorgente con "valore finto tipo
`core://greenhouse-01/{id-nodo}`". Quei valori fissano pixel/colori/animazioni esatti
(riprodotti fedelmente qui), ma non i dati: il backend reale ha solo **quattro** tipi
di nodo (non le 5 categorie Trigger/Lettura/Elaborazione/Logica/Uscita del
prototipo), fondati sugli struct firmware reali, non sul testo del task.

## Implementazione

- `node-kinds.ts` — icona/colore per i quattro tipi reali: `schedule`, `event-source`
  (insieme rappresentano sia "Trigger" che "Lettura" del prototipo — il firmware non
  ha un nodo di lettura separato), `block`, `rule` (sempre "Logica"/"Uscita": una Rule
  non ha mai una porta di uscita, strutturalmente).
- `to-nodes.ts` — conversione diretta `GraphState<"device-processing">` → nodi React
  Flow (non `toReactFlowNodes()` di `react-flow-adapter`, stessa ragione già
  documentata per Physical Composition: `EditorModel` non conosce Schedule/Event
  source/Block/Rule).
- `ProcessingNode.tsx` — stessa anatomia nodo di Physical Composition, nessun handle
  di connessione renderizzato (vedi gap).
- `NodeInspector.tsx` — form per i quattro tipi: Schedule/Event source referenziano un
  Module reale (select dai nodi Module del Physical Composition Graph dello stesso
  Core); Block/Rule hanno `blockTypeId`/`ruleTypeId` a testo libero (nessun catalogo
  Rule/Block esposto dal protocollo, stesso gap già documentato in UI-S040); Rule
  espone `sourceReference`/`commandTarget` come coppie Module+campo/comando numeriche,
  esattamente come modellato dal dominio (mai come edge, una Rule non ha porte).
  Validazione locale via `validateDeviceProcessingGraph` (cicli, riferimenti Module
  dangling, duplicati) — calcolata sui dati già in memoria, nessuna chiamata di rete.
- `ProcessingGraphScreen.tsx` — header (selettore Core, Dry-run, badge errori, "Invia
  a Deploy" disabilitato finché Dry-run non riporta zero errori), toolbar "+ tipo",
  canvas, status bar con hash reale del Config compilato.
- Dry-run reale: `dryRunConfig()` (S073) su `{physicalGraph, processingGraph, mqtt,
  connectivity, energy}` — locale, sincrono, nessuna chiamata al Core, esattamente
  come richiesto da `backend-behavior.md`.

## Bug reale risolto mentre si cablava questa schermata

**Loop di render infinito quando nessun Core è selezionato** ("Too many re-renders",
crash a schermo bianco, riprodotto dal vivo). Causa: il fallback per
`physicalGraphState` quando `bindingIndex < 0` era un letterale oggetto inline
(`?? { layer: "physical-composition", nodes: [], edges: [] }`), ricreato a ogni
render con un nuovo riferimento — questo alimentava `moduleNodes`/`moduleOptions`/
`moduleLabel`/`domainRfNodes`, e il pattern "resync `localNodes` durante il render se
cambia riferimento" (lo stesso già usato in Physical Composition) rilevava un cambio
a ogni singolo render, richiamando `setState` all'infinito. Corretto sostituendo il
letterale inline con una costante di modulo stabile (`EMPTY_PHYSICAL_GRAPH`), stesso
pattern già usato correttamente per `EMPTY_GRAPH`. Verificato dal vivo: schermata
aperta senza Core nel progetto, nessun crash, console pulita su una tab nuova.

## Gap onesti (non risolti in questo task)

- **Nessuna creazione di edge (collegamento) fra nodi** — stesso gap già documentato
  per Physical Composition/Catalog & Topology: `checkHandleCompatibility` (S042)
  richiede `HandleDescriptor` reali, ma `device-processing-graph-model`'s `ports.ts`
  dichiara esplicitamente che i dati di porta Block/Rule non sono ancora sul
  protocollo (`GET_CATALOG` espone solo `{typeId, commandCount}`). Gli edge già
  persistiti (nessuno, in pratica) verrebbero comunque renderizzati in sola lettura;
  non c'è un modo reale per crearne di nuovi oggi.
- **Catalogo Block/Rule host (S074)** — `blockTypeId`/`ruleTypeId` non sono più testo
  libero: la palette e l'Inspector usano `@spaghettilab/processing-block-catalog`.
  `GET_CATALOG` non elenca ancora Block/Rule; i `type_id` shipped coincidono con i
  driver firmware, quelli `planned` restano autorabili con warning in dry-run.
- **`resolveRuleActionFieldIds`/`resolveRuleSourceFieldIds`/`resolveBlockCost`/
  `resolveSourcePortOrField`/`resolveTargetInput`** (opzioni di `compileConfig`) non
  sono cablati — nessuno schema reale esiste ancora per derivarli (stesso gap del
  punto precedente). Una Rule con `commandTarget`/`sourceReference` compilerà quindi
  con questi campi non risolti; Dry-run lo segnalerà come i propri issue lo
  richiedono, non silenziosamente.
- **MQTT/connectivity/energy passati come valori espliciti disabilitati/default** —
  nessuna schermata autora ancora queste impostazioni (territorio di UI-S120);
  `compileConfig`/`dryRunConfig` li richiedono per compilare, quindi Dry-run usa
  `{mqtt: {enabled: false, ...}, connectivity: 0, energy: {...0}}` — valori onesti e
  dichiarati come tali nel codice, mai il vero stato del progetto (che non esiste
  ancora da nessuna parte).
- **"Graph 'Flow 1'" del prototipo (grafi multipli e nominati per Core) non esiste**
  — un solo `GraphState<"device-processing">` per Core (`project.deviceGraphs`,
  indicizzato come `physicalGraphs`), nessun concetto di grafi multipli nominati.
  Il titolo della schermata è "Processing Graph", non un nome di grafo editabile.
- **Verifica dal vivo limitata dall'assenza di un Core reale raggiungibile** in questo
  ambiente sandboxed (stesso limite già incontrato per UI-S040/UI-S050/UI-S060): il
  nuovo dialogo "Connetti un Core" (aggiornato da un altro ramo di lavoro parallelo
  nel frattempo) ora valida la connessione **prima** di persistere il binding, quindi
  non è stato possibile creare un binding di test senza un Core vero o un bridge USB
  reale per verificare dal vivo creazione nodi/Dry-run popolato. Verificato invece:
  stato vuoto (nessun Core), nessun crash, console pulita, CI verde (inclusi gli unit
  test già esistenti di `device-processing-graph-model`/`config-compiler`/
  `config-decompiler`, non riscritti qui).

## Verifica

- `docker compose run --rm micro-flow-editor npm run ci` — verde (typecheck, lint 0
  errori/6 warning pre-esistenti, test, build).
- Verificato dal vivo nel browser (tab pulita, senza cronologia HMR stantia):
  navigazione dal left rail, stato "Nessun Core nel progetto" senza crash (dopo il fix
  del loop di render), console senza errori.

# S043 — Adapter React Flow

**Stato:** ✅ DONE
**Dipende da:** S042

## Obiettivo

Collegare l'`EditorModel` alla superficie React Flow senza che React Flow diventi mai
fonte autorevole di dati di dominio.

## Implementazione richiesta

1. Implementa adapter bidirezionale Domain↔React Flow. Gli eventi React Flow diventano
   command di dominio (da S014); node/edge React Flow non diventano fonte autorevole.
2. Assicura che un catalogo fake aggiunga un nuovo tipo senza modificare sorgenti UI.

## Verifiche

- un test con catalogo fake introduce un nuovo Module/Block senza toccare switch o
  componenti concreti nell'adapter;
- lo stato React Flow (posizione, selezione, viewport) resta metadata locale e non
  altera l'esito della validazione di dominio.

## Fine task

- [x] React Flow adapter non contiene protocollo o validazione firmware.
- [x] Un tipo nuovo dal catalogo appare nell'editor senza patch al codice dell'adapter.

## Implementazione (2026-08-13)

Pacchetto `@spaghettilab/react-flow-adapter` (`software/micro-flow-editor/packages/react-flow-adapter/`):

**Direzione di lettura — domain → React Flow** (`to-react-flow.ts`): `toReactFlowNodes`/
`toReactFlowEdges` convertono un `GraphState` persistito in `Node`/`Edge` di
`@xyflow/react`. La risoluzione del tipo passa esclusivamente da `resolveNodeType()`
(`@spaghettilab/editor-model`, S042) — nessuno `switch` su `typeId` né import di
componenti concreti per tipo. `__tests__/to-react-flow.test.ts` verifica direttamente
il criterio di fine-task: un tipo presente solo in un `EditorModel` fittizio costruito
inline nel test viene risolto correttamente senza alcuna modifica al file adapter.
Posizione/selezione vengono lette solo da `AuthoringMetadata`, mai dal graph di
dominio; un tipo non risolto diventa un `PlaceholderDiagnostic` (S042), mai un nodo
scartato.

**Direzione di scrittura — React Flow → command di dominio**
(`react-flow-events.ts`, `graph-commands.ts`, `graph-lens.ts`):
`nodeChangesToCommands`/`edgeChangesToCommands` traducono `NodeChange[]`/`EdgeChange[]`
(da `onNodesChange`/`onEdgesChange`) in `ProjectCommand`: i cambi `position`/`select`
diventano solo `updateAuthoringMetadataCommand` (non toccano mai un graph e non
possono fallire — verificato in `graph-commands.test.ts`), i cambi `remove` diventano
`removeGraphNodeCommand`/`removeGraphEdgeCommand` che passano dalla validazione reale
di `Graph` (estesa in questo task con `removeNode`/`removeNodeCascade`/`removeEdge` in
`@spaghettilab/domain`). `connectionToCommand` traduce un `Connection` di `onConnect`
in `addGraphEdgeCommand` solo dopo `checkHandleCompatibility()` (S042); se uno dei due
handle non è risolvibile tramite il callback `resolveHandle` fornito dal chiamante, la
connessione viene rifiutata invece di essere ammessa in modo ottimistico. Ogni comando
di editing è generico rispetto al graph target tramite `GraphLens<Layer>` (grafo
system-automation singolo, o array `deviceGraphs`/`physicalGraphs` per Core) —
nessun nuovo sottotipo di `ProjectCommand` è stato necessario: il contratto esistente
di S014 era già sufficientemente generico.

**Estensione del dominio**: `Graph` (S013, `packages/domain/src/graph.ts`) non aveva
rimozione di nodi/archi, necessaria per un editor interattivo. Aggiunti
`removeNode()` (fallisce se esistono archi dipendenti), `removeNodeCascade()`
(rimuove nodo + archi dipendenti) e `removeEdge()`, con 6 nuovi test in
`graph.test.ts`.

**Test**: 21 nuovi test in 3 file (`to-react-flow.test.ts`, `graph-commands.test.ts`,
`react-flow-events.test.ts`) più i 6 nuovi test di dominio in `graph.test.ts`. CI
completa (lint, typecheck, test, build) verde via Docker
(`docker compose run --rm micro-flow-editor npm run ci`).

**Scope onestamente incompleto**: `handles`/`propertySchema` restano vuoti per ogni
tipo (gap ereditato da S042, che a sua volta discende dal fatto che il protocollo
wire V1 non porta ancora dati di schema per driver/Rule/Block — vedi S021). Il gate di
compatibilità delle connessioni (`connectionToCommand`) è quindi cablato correttamente
ma non ha ancora dati reali da verificare: ogni connessione viene attualmente
rifiutata per mancanza di handle risolvibili, comportamento onesto e non un difetto —
inizierà ad ammettere connessioni reali non appena esisterà una sorgente di
risoluzione handle, senza modifiche a questo adapter.

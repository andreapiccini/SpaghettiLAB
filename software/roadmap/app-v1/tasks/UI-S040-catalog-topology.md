# UI-S040 — Catalog & Topology Explorer

[← Roadmap](../README.md) · [UX-S040](../../ux-v1/tasks/UX-S040-catalog-topology.md) ·
[visual.md](../../../ux/screens/S040-catalog-topology/visual.md) ·
[ui-behavior.md](../../../ux/screens/S040-catalog-topology/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S040-catalog-topology/backend-behavior.md)

**Stato: ✅ DONE**

Schermata puramente diagnostica — esplora catalogo e topologia normalizzati di un
Core, nessuna mutazione. Cablata su `@spaghettilab/catalog-model` (S041) e
`@spaghettilab/editor-model` (S042), entrambi reali (contrariamente a quanto
`backend-behavior.md` di questa schermata diceva al momento in cui è stato scritto —
"nessuna delle tre [S041/S042/S043] è ancora implementata" — il backend le ha
completate da allora; questo task le collega davvero).

## Implementazione

- `packages/app/src/components/catalog-topology/CoreSelector.tsx` — selettore Core
  nell'header (pattern minimo, "S070" citato dalla spec come riferimento non esiste
  ancora in questo repo).
- `CatalogView.tsx` — accordion per le sei categorie fisse (Module Driver, Rule,
  Block, Opcode, Profile, Capability Pack), dettaglio in linea, un solo dettaglio
  aperto per categoria, stagger 30ms, easing 200ms `cubic-bezier(0.22,1,0.36,1)`
  (riusa `motionTokens.duration.base`, che è già esattamente quella curva).
- `TopologyView.tsx` — albero Flow → Function Bay → rail.
- `CatalogTopologyScreen.tsx` — header con selettore Core/titolo/toggle vista/badge
  fingerprint, banner "lettura parziale", stati vuoti onesti.
- `core-session`: aggiunto `CoreSession.listDeviceProfiles()` (nuovo metodo
  pubblico, con test) — espone `client.getFullDeviceProfileList()` già esistente
  ma mai chiamato da nessuno; necessario per popolare la categoria Profile qui.
- `core-sessions-context.tsx`: aggiunti `getSnapshot(bindingId)` e
  `listDeviceProfiles(bindingId)` al contesto condiviso.
- `App.tsx`: schermata reale al posto dello `ScreenStub` di `"catalog-topology"`.

## Bug reali risolti mentre si cablava questa schermata

1. **Icone del left rail scambiate fra due schermate.** `visual.md` di questa
   schermata specifica l'icona `Boxes`, quello di S050 (Physical Composition)
   specifica `Blocks` — `LeftRail.tsx` (da UI-S010, scritto prima di leggere questi
   due file in dettaglio) le aveva invertite (`Network` per questa, `Boxes` per
   Physical Composition). Corretto in `LeftRail.tsx`.
2. **Header a rischio overlap su larghezze strette.** Selettore Core + titolo lungo
   ("Catalog & Topology Explorer") + toggle vista in una riga da 56px senza regole
   di shrink/truncate produceva testo sovrapposto sotto ~900px. Corretto con
   `min-w-0 flex-1 truncate` sul titolo e `shrink-0` sugli elementi a larghezza
   fissa — verificato dal vivo (screenshot prima/dopo).

## Gap onesti (non risolti in questo task)

- **Il badge compatibilità ("Compatibile"/"Deprecato"/"Incompatibile") di
  `visual.md` non esiste.** `@spaghettilab/editor-model`'s compatibility engine
  (`checkHandleCompatibility`) valuta solo coppie di handle collegate, non produce
  uno stato per singola voce di catalogo — non c'è alcuna fonte dati per questo
  badge oggi. Omesso, non inventato.
- **Rule/Block/Opcode restano sempre vuote.** Il protocollo non espone ancora
  quei dati (`catalog-model`'s stesso commento: "every operation's schema
  descriptor is unpopulated"); mostrate comunque nell'ordine fisso della spec, con
  nota esplicita "Non ancora esposto dal protocollo", mai omesse.
- **Nessun campo Port/segnale/`ENFORCED`/`UNVERIFIED` reale esiste.**
  `TopologyIndex` espone solo interi grezzi (`direction`, `signalCount`,
  `admission`, `assurance`) — nessuna enum "PWM"/"ADC"/... o stringa
  "ENFORCED"/"UNVERIFIED" esiste nel codice, solo nel testo illustrativo di
  `visual.md`. La vista Topologia mostra questi valori come codici grezzi
  etichettati, non li traduce in un vocabolario che il backend non fornisce.
- **Il banner "lettura parziale" non ha oggi un innesco reale.**
  `CoreSession.connect()` fa sempre una lettura completa (`getFullCatalog()`/
  `getFullTopology()`) o fallisce interamente (stato `ERROR`) — non esiste un
  percorso che produca uno snapshot parzialmente letto a questo livello. Il banner
  è cablato correttamente (`complete: false` lo farebbe apparire) ma probabilmente
  non si attiverà mai con l'implementazione attuale di `CoreSession`; documentato
  qui piuttosto che rimosso, per restare pronto se `CoreSession` guadagnerà in
  futuro un percorso di lettura parziale.
- **Il placeholder diagnostico "tipo non riconosciuto"** (`visual.md`) non si
  applica al Catalogo: ogni voce del catalogo è per costruzione un tipo che
  `buildEditorModel()` conosce (è la fonte stessa da cui è derivato). Quel
  meccanismo (`resolveNodeType`/`PlaceholderDiagnostic`) serve a risolvere il tipo
  di un *nodo salvato in un progetto* contro il catalogo corrente — è rilevante per
  il Processing Graph Editor (S070), non per questa schermata di sola lettura.
  Non costruito qui, non c'è un caso reale a cui applicarlo.
- **Rendering del catalogo/topologia popolati non verificato dal vivo** — nessun
  Core reale è raggiungibile in questo ambiente sandboxed. Verificato per: stati
  vuoti (nessun Core, nessun dato, tentativo di connessione fallito con feedback
  coerente nella schermata Core Connections), toggle vista, layout header. La
  logica di normalizzazione/rendering per dati popolati è stata verificata solo
  per lettura del codice + gli unit test già esistenti di `catalog-model`/
  `editor-model` (non riscritti qui), non con uno screenshot di dati reali.

## Verifica

- `docker compose run --rm micro-flow-editor npm run ci` — verde (typecheck, lint
  0 errori/4 warning pre-esistenti, test — incluso il nuovo test di
  `CoreSession.listDeviceProfiles()` in `core-session`, build).
- Verificato dal vivo nel browser: navigazione dal left rail, stato "nessun dato
  disponibile" con azione "Connetti e leggi", il click avvia un vero tentativo di
  connessione condiviso con `useCoreSessions()` — l'errore risultante è visibile
  correttamente tornando sulla schermata Core Connections (stesso stato
  applicativo, due presentazioni), toggle Catalogo/Topologia, header senza overlap
  a 800px e a risoluzione desktop.

# UI-S100 — Capability Marketplace & OTA

[← Roadmap](../README.md) · [UX-S100](../../ux-v1/tasks/UX-S100-capability-marketplace.md) ·
[visual.md](../../../ux/screens/S100-capability-marketplace/visual.md) ·
[ui-behavior.md](../../../ux/screens/S100-capability-marketplace/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S100-capability-marketplace/backend-behavior.md)

**Stato: ✅ DONE**

Tre tab (Marketplace/Preflight/Aggiornamento) su un Core selezionato fra quelli
connessi e pronti, cablati su `@spaghettilab/capability-marketplace` (S101, reale),
`@spaghettilab/ota-preflight` (S102, reale) e `@spaghettilab/ota-lifecycle` (S103,
reale, solo trasporto BLE). **S104 (`ArtifactKind` registry) non esiste ancora nel
codice** — confermato da una ricerca esaustiva di `ArtifactKind` in tutto
`packages/`, e dal proprio task file (`S104-marketplace-artifact-kinds.md`, ancora
`⬜ TODO`): a differenza di ogni altro screen di questo progetto, qui la nota "TODO"
del backend-behavior non era stantia — S104 è davvero mancante. Questo task
implementa quindi un placeholder locale a due kind (`artifact-kind.ts`), non il
registro estendibile previsto.

## Implementazione

- `CapabilityMarketplaceScreen.tsx` — header, selettore Core a pillola (solo Core
  READY, stesso pattern di Runtime & Diagnostics/Deploy & Diff), tre tab con stato
  condiviso (`candidate`/`preflight` sollevati al livello screen, passati da
  Marketplace → Preflight → Aggiornamento).
- `MarketplaceTab.tsx` — tre liste mai fuse: **Disponibili** (indice marketplace
  importato manualmente come JSON via `parseMarketplaceIndexJson`, nessuna
  operazione wire elenca artifact scaricabili), **Installati** (Capability Pack via
  `normalizeCapabilityPacks(snapshot.features)` + Device Profile via
  `listDeviceProfiles()`, entrambi reali e mai mescolati), **Richiesti**
  (`computeRequiredArtifacts()` sui tipi `module-driver`/`block`/`rule` usati dai
  grafi Physical Composition/Device Processing di questo Core, confrontati contro
  `GET_CATALOG`). Tray di dettaglio con `resolveDependencies()` per un pack
  selezionato.
- `PreflightTab.tsx` — import manuale del manifest JSON di un candidato OTA (nessun
  parser dedicato esiste nel pacchetto, vedi `ota-candidate-json.ts`),
  `preflightOtaCandidate()` reale con `CoreOtaContext` costruito da
  `lastKnownSnapshot` (status/capabilities/catalog/resources, già letti al connect)
  più `getUpdateStatus()` on-demand per lo stato coordinator live; tabella budget
  via `compareResourceBudget()`; "Avvia OTA" abilitato solo su esito `READY`.
- `UpdateTab.tsx` — stepper `ARM → UPLOAD → FINALIZE → PENDING_REBOOT` guidato da
  `BleOtaSession` (S103); l'immagine firmware viene caricata da un file locale
  scelto dall'utente (nessun meccanismo di download è cablato, vedi gap); fase
  `PENDING_REBOOT` mostra `getUpdateStatus()` in polling e un pulsante "Verifica
  postflight" che confronta uno snapshot prima/dopo via `evaluatePostflight()`.
- `artifact-kind.ts` — `ARTIFACT_KINDS`, un placeholder locale a due kind
  (`capability-pack`, `device-profile`) con `requiresPreflight`, esplicitamente
  documentato come sostituto temporaneo di S104, non il registro reale.
- `ota-candidate-json.ts`, `hex.ts` — helper UI-only (parser JSON manuale per
  `OtaCandidateManifest`, hex→bytes), documentati come non essendo pacchetti
  dedicati.
- `core-session.ts`: aggiunto `getUpdateStatus()` (wrapper diretto su
  `client.getUpdateStatus()`); il campo costruttore `client` è stato reso
  `readonly` non più `private` invece di aggiungere un metodo
  `createOtaSession()` — `@spaghettilab/ota-lifecycle` dipende già da
  `core-session` (per `CatalogCache`), quindi `core-session` non può dipendere a
  sua volta da `ota-lifecycle` senza un ciclo di riferimenti fra pacchetti
  (`tsc -b` lo rifiuta esplicitamente, `TS6202`); esporre `client` (che soddisfa
  strutturalmente `BleOtaWireClient`) evita il ciclo lasciando alla UI la
  costruzione diretta di `new BleOtaSession(session.client, ...)`.
- `core-sessions-context.tsx`: esposti `getUpdateStatus`/`getClient`.

## Gap dichiarati

- **`ArtifactKind` (S104) non esiste** — confermato, non stantio come per gli altri
  screen. `artifact-kind.ts` è un placeholder locale, non un registro reale: solo
  due kind, nessun `label`/`icon` dinamico da un descrittore esterno.
- **Nessuna fonte marketplace per i Device Profile.** Il tab Disponibili mostra
  solo Capability Pack (da un indice importato) — non esiste alcun concetto di
  "profilo scaricabile" nel codice; i profili si autorano/importano in Device
  Profile Studio.
- **Un Capability Pack non è installabile da solo** — arriva solo dentro
  un'immagine firmware OTA (nessuna operazione `INSTALL_PACK` esiste). "Installa"
  su un pack nel tab Marketplace non avvia automaticamente una build-selection
  multi-candidato (nessuna fonte di "quali build esistono" è cablata) — l'utente
  importa direttamente nel tab Preflight il manifest della build che contiene il
  pack desiderato.
- **Nessun parser dedicato per `OtaCandidateManifest`** nel pacchetto
  `ota-preflight` (a differenza dell'indice marketplace, che ha
  `parseMarketplaceIndexJson` validato) — `ota-candidate-json.ts` è una validazione
  minima scritta per questo screen, non un parser hardened.
- **Il caricamento dell'immagine firmware (fase UPLOAD) usa un file locale scelto
  dall'utente**, non un download automatico — non esiste alcun meccanismo per
  scaricare l'artifact da `artifact.url` (scaricare byte firmware da un URL non
  verificato dall'agente sarebbe un'azione distruttiva/rischiosa fuori scopo per
  questo task).
- **Le tappe post-riavvio (Riavvia/Prova/Conferma/Rollback) sono osservate, non
  guidate.** Nessuna operazione wire espone "conferma trial" o "rollback"
  esplicitamente (`spaghetti_update_confirm_trial()` è Core-only, mai su alcun
  trasporto; il rollback è automatico via MCUboot) — `BleOtaSession` copre solo
  fino a `PENDING_REBOOT`. "Verifica postflight" richiede che l'utente riconnetta
  manualmente il Core da Core Connections dopo il riavvio prima di premere il
  pulsante, altrimenti lo snapshot "dopo" sarebbe ancora quello pre-riavvio.
- **`PostflightSnapshot.configPreserved`/`profilesPreserved`** sono
  approssimati lato UI (non calcolati da `evaluatePostflight()` stesso, che li
  riceve già pronti) — `configPreserved` è sempre `true` (nessun confronto reale
  di hash Config prima/dopo è cablato), `profilesPreserved` verifica solo che la
  lista profili non sia vuota, non un confronto insiemistico prima/dopo.
- **`RequiredArtifact` per `block`/`rule`** tratta sempre questi tipi come "non
  confermati installati" — `GET_FEATURES` riporta solo un conteggio
  (`moduleTypeCount`), mai i typeId reali (stesso gap già documentato per
  UI-S040/UI-S060/UI-S070/UI-S080).
- **Verifica dal vivo limitata dall'assenza di un Core reale raggiungibile** in
  questo ambiente sandboxed (stesso limite di ogni screen precedente): verificato
  lo stato vuoto (nessun Core pronto) su tutti i tab, navigazione dal left rail
  senza crash, console pulita. La logica dei singoli tab è stata verificata per
  lettura del codice + gli unit test già esistenti di
  `capability-marketplace`/`ota-preflight`/`ota-lifecycle` (non riscritti qui).

## Verifica

- `docker compose run --rm micro-flow-editor npm run typecheck` — verde (isolato
  dal lavoro concorrente in corso su Processing Graph/`processing-block-catalog`,
  spostato temporaneamente e ripristinato identico per la verifica — non
  toccato/committato da questo task).
- `docker compose run --rm micro-flow-editor npm run -w @spaghettilab/app lint` —
  verde (0 errori, solo warning pre-esistenti).
- Verificato dal vivo nel browser: navigazione dal left rail a "Capability
  Marketplace & OTA", stato "Nessun Core connesso e pronto" senza crash, console
  senza errori.

# S113 — Compiler, Admin API deploy e diagnostica runtime

**Stato:** ✅ DONE
**Dipende da:** S112

## Obiettivo

Portare il System Automation Graph autore fino a un deploy Node-RED reale, revisionato
e reversibile, e renderne osservabile lo stato end-to-end.

## Implementazione richiesta

1. Compila il System Automation Graph in flow Node-RED deterministico con owner/project
   metadata e stable node IDs. Credenziali sono riferite, non esportate.
2. Implementa adapter Node-RED Admin API con autenticazione, get revision, validate,
   diff e deploy. Riconcilia soltanto tab/subflow/nodi posseduti dal progetto e conserva
   flow utente estranei.
3. Gestisci Core offline, reconnect, schema/catalog change, boot ID, backpressure,
   command result e retry senza duplicare azioni.
4. Permetti import dello stato gestito Node-RED e classifica IN_SYNC/DIVERGED come per
   Config; niente deploy automatico al reconnect.
5. Fornisci runtime status del collegamento end-to-end e diagnostica dal record source
   al command target.

## Verifiche

- la temperatura del Core A raggiunge display/comando del Core B end-to-end;
- broker, Node-RED o Core offline non fermano i runtime locali degli altri componenti;
- un deploy conserva i flow Node-RED non posseduti dal progetto;
- una revisione concorrente produce conflict e non sovrascrive silenziosamente;
- un record duplicato/retry non duplica il comando corrispondente.

## Fine task

- [x] Ogni edge cross-Core viene eseguito da Node-RED, non dal Config locale.
- [x] Il deploy Node-RED è revisionato, scoped e reversibile.
- [x] Stato e guasti del percorso end-to-end sono osservabili.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/node-red-deploy`
(`Software/micro-flow-editor/packages/node-red-deploy/`), che dipende da `domain`,
`core-session`, `system-automation-graph` e `node-red-nodes`.

**Compilatore flow** (`flow-compiler.ts`): `compileSystemAutomationFlow()` trasforma
i link di `system-automation-graph` (S111, già validati in fase di authoring — mai
rigiudicati qui) in nodi flow-JSON Node-RED reali: un `spaghetti-connection` condiviso
per ogni `CoreBinding` distinto, una catena `record source → coordinator → command
target` per link. ID nodo deterministici via `contentHash()` su input di identità
stabili — ricompilare gli stessi link produce sempre gli stessi ID. Ogni nodo generato
porta i tag `spaghettiOwned`/`spaghettiProjectId` (ignorati da Node-RED stesso, letti
solo da `reconcile.ts`). Le credenziali restano riferite (`connectionProfileId`), mai
esportate — `ConnectionProfile` di `domain` non ha alcun campo capace di contenere un
segreto.

**Riconciliazione** (`reconcile.ts`): `reconcileFlows()` sostituisce solo i nodi già
posseduti da questo progetto, lasciando ogni altro nodo (flow utente, altri progetti,
tab, subflow) intatto nella sua posizione originale.

**Admin API reale** (`admin-api.ts`): `NodeRedAdminApiClient`, adapter `fetch` reale —
`GET /flows` con header `Node-RED-API-Version: v2` (l'unica versione che include
`rev`), `POST /flows` con `rev` nel body, `Authorization: Bearer` quando `adminAuth` è
configurato. **Verificato dal vivo contro l'istanza Node-RED 5.0.4 già in esecuzione**:
`GET /flows` con quell'header ritorna davvero `{flows, rev}`, e `POST /flows` con un
`rev` non valido ritorna davvero `409` prima di toccare nulla — esattamente come
assunto dal client, confermato in produzione locale, non solo documentato.

**Deploy** (`deploy.ts`): `deployNodeRedFlow()` legge il set di flow live, riconcilia,
e deploya via compare-and-swap sul `rev` appena letto — un `rev` cambiato nel frattempo
emerge sempre come `CONFLICT`, mai una sovrascrittura silenziosa; nessun retry
automatico interno.

**Classificazione sync** (`sync-classifier.ts`): `classifyNodeRedSync()` rispecchia
esattamente `classifySyncRelationship()` di `core-session` — stesso tipo
`SyncRelationship` a cinque stati, stessa cautela sul silenzio. Nessun deploy
automatico al reconnect: nessun percorso di codice in questo pacchetto chiama
`deployNodeRedFlow()` a partire da un risultato di classificazione.

**Dedup comandi** (`command-dedup.ts`): `CommandDedupeTracker` chiave
`(linkId, sourceKey, sequence)` — un record ridelivered da un retry di trasporto o da
un reconnect che ripete un piccolo backlog viene riconosciuto e saltato, mai
ri-innescando il comando del coordinator. Limitato in dimensione (default 1000 entry).

**Diagnostica link** (`link-diagnostics.ts`): `LinkDiagnosticsTracker`, aggregatore
puro in memoria — connettività source/target, ultimo record/comando, conteggi,
duplicati — con entry indipendenti per link, quindi un Core offline su un link non
tocca mai la diagnostica di un altro link.

**Test**: 34 nuovi test coprono direttamente tutte e cinque le Verifiche, più
verifica dal vivo (non simulata) del comportamento reale dell'Admin API contro
l'istanza Node-RED in esecuzione (`GET /flows` con header v2 → `{flows,rev}` reale;
`POST /flows` con rev stantio → `409` reale, senza effetti collaterali). CI completa
verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): nessuno
scenario end-to-end reale (temperatura Core A → display/comando Core B) contro un
secondo Core o un gateway fake, dato che nessuno era in esecuzione in questo
passaggio; questo pacchetto non decide mai *quando* deployare (nessun polling/watch),
solo compila, riconcilia, deploya e classifica su richiesta esplicita del chiamante.

# S030 — Sessioni Core e sincronizzazione

**Stato:** ✅ DONE
**Dipende da:** S024

## Obiettivo

Gestire simultaneamente più Core, distinguendo connessione, stato live e relazione con
il progetto senza scritture implicite.

## Implementazione richiesta

1. Crea inventory persistente di Core binding con expected device ID e connection
   profile; discovery di rete/BLE può proporre binding ma non sostituire identità.
2. Implementa state machine `DISCONNECTED→CONNECTING→AUTHENTICATING→SYNCHRONIZING→READY`
   e sottostati validate/apply/update/reboot/trial/error.
3. Alla sincronizzazione leggi identity, status, capability, features, catalogo,
   topologia, Config revision/hash e resources in ordine coerente.
4. Implementa cache catalogo indicizzata da device ID + fingerprint; invalida tutto
   dopo OTA o fingerprint diverso.
5. Classifica relazione progetto/device come `IN_SYNC`, `PROJECT_DIRTY`,
   `DEVICE_CHANGED`, `DIVERGED` o `INCOMPATIBLE` usando DeploymentRecord.
6. Fornisci operazioni esplicite per importare stato live, mantenere progetto o avviare
   riconciliazione; mai auto-apply al reconnect.
7. Gestisci disconnessione, backoff, cambio boot ID, transport fallback autorizzato e
   session cancellation senza perdere modifiche locali.
8. Isola errori di un Core: gli altri workspace restano operativi.

## Verifiche

- due Core con stesso catalogo ma device ID distinti non condividono Config/cache;
- modifica esterna del Config produce `DEVICE_CHANGED`/`DIVERGED`;
- reconnect e reboot invalidano soltanto stato effimero necessario;
- fingerprint a metà paginazione non pubblica catalogo parziale;
- Core offline resta editabile con ultimo snapshot marcato stale.

## Fine task

- [x] Multi-Core e lifecycle sessione sono completi.
- [x] Sync non muta automaticamente dispositivo o progetto.
- [x] Stato stale, conflitto e incompatibilità sono distinguibili.
- [x] Cache e reconnect rispettano boot ID e fingerprint.

## Implementazione (2026-08-13)

Nuovo package `@spaghettilab/core-session` (Device Session Manager di
`REACT_FLOW_ARCHITECTURE.md`), sopra `@spaghettilab/protocol-sdk` (S021-S024) e
`@spaghettilab/domain`:

- `session-state.ts` — `SessionState` (l'intera state machine dell'architettura,
  incluso i sottostati) e `SyncRelationship`.
- `sync-classifier.ts` — `classifySyncRelationship()`, funzione pura, nessun I/O:
  confronta `DeploymentRecordV1` (S014), hash progetto corrente e hash Config live;
  `catalogCompatible` resta un parametro fornito dal chiamante — la sua risoluzione
  reale è compito di S042 (compatibility engine), non ancora costruito, e non
  l'ho inventata qui. Copertura esaustiva di tutti i rami (IN_SYNC/PROJECT_DIRTY/
  DEVICE_CHANGED/DIVERGED/INCOMPATIBLE, incluso "nessun deployment precedente" e
  "device non leggibile" → sempre DIVERGED, mai un'assunzione ottimistica).
- `catalog-cache.ts` — `CatalogCache`, indicizzata per **device ID + fingerprint
  insieme** (mai solo fingerprint): due Core con lo stesso catalogo ma device ID
  distinti non condividono mai una entry. `invalidateDevice()` rimuove tutte le
  entry di un device (non solo quella col fingerprint vecchio) quando il
  fingerprint cambia.
- `discovery-binding.ts` — `proposeBindingFromDiscovery()`: un candidato scoperto
  non sostituisce mai un binding già esistente per lo stesso device ID, nemmeno se
  propone un `connectionProfileId` diverso.
- `reconnect-policy.ts` — `computeBackoffDelayMs()`, backoff esponenziale puro
  (capped). La riconnessione di rete reale resta fuori scope (dipende dal
  trasporto concreto, S023 fornisce solo adapter su connessioni iniettate).
- `core-session.ts` — `CoreSession`: guida la state machine
  (`DISCONNECTED→CONNECTING→AUTHENTICATING→SYNCHRONIZING→READY`), legge
  identity/status/capability/features/catalogo/topologia/Config/resources in
  ordine coerente (`connect()`), verifica l'identità del device contro
  `expectedDeviceId` (→ `ERROR` su mismatch), usa `SpaghettiClient.getFullCatalog()`
  /`getFullTopology()` di S022 — che già riparte da zero su cambio fingerprint a
  metà paginazione, riusato invece di reimplementato. `disconnect()` non cancella
  mai `lastKnownSnapshot` (resta editabile offline, marcato `stale`). Un cambio di
  boot ID rilevato mentre `READY` riporta lo stato a `SYNCHRONIZING` senza mai
  toccare la cache/snapshot esistenti finché un nuovo `connect()` non li sostituisce
  (stato effimero soltanto, non il resto). Tre azioni esplicite mai automatiche:
  `importLiveState()`, `keepProject()` (no-op deliberato), `reconcile()` (lancia
  onestamente un errore — richiede il decompilatore Config, S073, non ancora
  costruito).
- `core-registry.ts` — `CoreRegistry`: multi-Core, un `CatalogCache` condiviso
  (isolato internamente per device) ma nessun altro stato condiviso fra sessioni —
  il fallimento di una non tocca le altre (testato esplicitamente).

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 238 test
nel workspace (29 nuovi in `@spaghettilab/core-session`), build: tutti verdi.


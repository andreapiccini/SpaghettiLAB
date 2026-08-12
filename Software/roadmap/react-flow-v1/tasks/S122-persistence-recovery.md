# S122 — Persistenza robusta: autosave, backup e concorrenza

**Stato:** ✅ DONE
**Dipende da:** S121

## Obiettivo

Rendere impossibile perdere lavoro per un crash, una migration fallita o due schede
aperte sullo stesso progetto.

## Implementazione richiesta

1. Implementa project autosave transazionale, version history bounded, backup prima di
   migration, crash recovery e controllo concorrenza fra tab/processi.

## Verifiche

- un crash durante una migration conserva una copia recuperabile del progetto;
- due tab concorrenti sullo stesso progetto non lo corrompono;
- l'autosave è transazionale: un salvataggio interrotto non lascia un file a metà.

## Fine task

- [x] Backup, migration e crash recovery sono provati con test dedicati.
- [x] La concorrenza fra tab/processi non può corrompere il Project.

## Implementazione (2026-08-12)

`ProjectAutosaveStore` in `packages/project-store/src/project-autosave-store.ts`,
sopra il `Storage` port esistente (nessuna nuova capacità richiesta alla porta):

- **Autosave transazionale**: ogni revisione è scritta su una chiave immutabile
  `rev:<n>` mai sovrascritta; il puntatore `meta` (head + history) è l'unica chiave
  che si sposta, scritta per ultima in una singola `Storage.set()` — il punto di
  commit. Un crash prima di quella scrittura lascia i lettori sulla revisione
  precedente intatta, mai su uno stato a metà (provato simulando un crash dopo il
  primo `set()` con uno storage-decorator che lancia dal secondo in poi).
- **Cronologia versioni bounded**: `history()` mantiene le ultime `maxHistory`
  revisioni (default 10), le più vecchie vengono rimosse da storage dopo ogni save
  riuscito.
- **Backup pre-migration**: al caricamento di una revisione con schema più vecchio,
  i byte grezzi vengono salvati su una chiave immutabile dedicata **prima** di
  tentare la migrazione — provato con una migrazione che fallisce (nessuna
  registrata per quello schema): il backup resta comunque presente.
- **Crash recovery**: se `meta` è mancante o illeggibile, viene ricostruito
  scansionando le chiavi `rev:` esistenti e validandole una per una — la revisione
  valida più recente diventa la nuova head.
- **Concorrenza fra tab/processi**: `save()` richiede `expectedRevision` (l'ultima
  revisione letta dal chiamante); un mismatch (un altro tab ha già salvato nel
  frattempo) restituisce `ProjectStoreErrorCode.CONCURRENT_WRITE_CONFLICT` senza
  scrivere nulla — mai un ultimo-vince silenzioso.
- Nuovo `packages/project-store/src/errors.ts` con codici propri del package
  (`CONCURRENT_WRITE_CONFLICT`, `NO_RECOVERABLE_REVISION`), coerente con la nota di
  `DomainErrorCode` ("non è pensato per diventare un enum globale").

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 82 test
(11 nuovi), build: tutti verdi.

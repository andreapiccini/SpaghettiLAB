# S014 — ProjectV1, persistenza e comandi con undo/redo

**Stato:** ✅ DONE
**Dipende da:** S013

## Obiettivo

Rendere il Project persistibile, versionabile e modificabile in modo deterministico e
reversibile.

## Implementazione richiesta

1. Definisci `ProjectV1`, schema JSON canonico, validatore runtime, import/export,
   migration registry, hashing e golden file.
2. Definisci command/event per modificare il dominio con undo/redo deterministico.

## Verifiche

- round-trip e migration di Project golden;
- hash non cambia per ordine non significativo o metadata visuali esclusi;
- undo/redo riproduce esattamente lo stato precedente/successivo, incluse sequenze
  miste di comandi su entità diverse.

## Fine task

- [x] Project V1 e migration policy sono documentati e testati.
- [x] Ogni mutazione del dominio passa da un comando con undo/redo, nessuna mutazione
      diretta non tracciata.

## Implementazione (2026-08-12)

`packages/domain/src/`: `hash.ts` (`contentHash`, FNV-1a deterministico, zero
dipendenze — non è l'hash CBOR del Config, quello è S072), `project.ts`
(`ProjectV1` completo secondo REACT_FLOW_ARCHITECTURE.md § Modello dati
principale — schemaVersion/projectId/name/coreBindings/physicalGraphs/
deviceGraphs/systemAutomationGraph/requiredArtifacts/deploymentRecords/
authoringMetadata; `validateProjectV1` raccoglie tutti i problemi invece di
fermarsi al primo; `exportProjectV1`/`importProjectV1`; `canonicalProjectHash`
esclude authoringMetadata e ordina gli array non significativi prima
dell'hash), `project-migrations.ts` (`MigrationRegistry` generico, il
registro reale dell'app parte vuoto — V1 è la prima versione, nulla da cui
migrare — il meccanismo è comunque provato con un registro sintetico nei
test), `commands.ts` (`CommandStack` basato su snapshot: ogni `execute` salva
lo stato precedente per intero, `undo`/`redo` lo ripristinano esattamente per
costruzione, non per replay di operazioni inverse — 3 comandi:
renameProject/addCoreBinding/removeCoreBinding).

`packages/project-store/src/project-repository.ts`: `ProjectRepository`,
l'unico punto in cui la porta `Storage` (S011) incontra `ProjectV1` — pura
orchestrazione I/O, la validazione resta nel domain. Prima implementazione
reale del package (era placeholder da S011).

Golden fixture: `packages/domain/src/__fixtures__/project.golden.json`,
verificato con round-trip export→import. 67 test totali (63 domain + 4
project-store), coverage 95%+ sui file nuovi del domain.

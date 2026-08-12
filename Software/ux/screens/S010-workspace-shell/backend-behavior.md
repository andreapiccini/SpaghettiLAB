# Project/Workspace Shell — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione dell'SDK parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Riferimenti: `createEmptyProject` (`packages/domain/src/project.ts`),
`ProjectRepository` (`packages/project-store/src/project-repository.ts`, S014),
`CommandStack` (`packages/domain/src/commands.ts`, S014).

## Caricamento del Project Picker (mount)

1. `ProjectRepository.listProjectIds()` → elenco di `ProjectId`.
2. Per ciascun id, `ProjectRepository.load(id)` per ottenere `name` e la lunghezza di
   `coreBindings` (conteggio Core collegati mostrato sulla card) — **nota onesta**:
   `ProjectRepository` oggi non espone un metodo "leggero" che restituisca solo i
   metadati; per popolare la griglia bisogna caricare ogni progetto per intero. Non è
   un problema di correttezza, ma un limite di performance da tenere presente se il
   numero di progetti crescerà; non risolto da questo task.
3. Se `listProjectIds()` o un `load()` restituisce `Result.err`, lo stato Errore
   (vedi `visual.md`) mostra `error.message`; "Riprova" ripete il passo 1.

## "+ Nuovo progetto"

1. Validato il nome lato client (`ui-behavior.md`), si chiama
   `createEmptyProject(name)` → `ProjectV1` con `PROJECT_SCHEMA_VERSION` corrente.
2. `ProjectRepository.save(project)` per persisterlo.
3. Se `save()` restituisce `err`, il dialogo resta aperto con l'errore mostrato sotto
   il campo nome (stesso stile di un errore di validazione, ma il testo viene da
   `DomainError.message`, non da una regola locale).
4. Al successo: il dialogo si chiude e si naviga alla schermata di apertura del
   progetto (fuori dallo scope di questo task — vedi `UX-S030` per cosa succede
   nell'aprire un Core).

## Apertura di un progetto (click su una card)

1. `ProjectRepository.load(projectId)`.
2. Un `CommandStack` viene istanziato per la sessione di editing, inizializzato con lo
   stato del progetto caricato — è lo stack che alimenta gli indicatori
   `canUndo()`/`canRedo()` nella top bar per tutta la sessione, non solo per questa
   schermata.

## Import

1. Il file letto dal file picker (vedi `ui-behavior.md`) viene passato a
   `importProjectV1(rawJson)` — che internamente valida lo schema
   (`validateProjectV1`) ed esegue `migrateProjectToLatest()` se la versione è più
   vecchia di `PROJECT_SCHEMA_VERSION`.
2. Se `importProjectV1` restituisce `err` (`DomainErrorCode.INVALID_SCHEMA` o
   `MIGRATION_NOT_FOUND`), lo skeleton si sostituisce con un banner d'errore che
   riporta `error.message` — nessuna scrittura avviene.
3. Al successo, `ProjectRepository.save(project)` per persisterlo nel workspace, poi
   la card compare nella griglia.

## Export

Non è ancora un pulsante elencato nel wireframe del picker in `visual.md` (l'export è
per-progetto, disponibile da dentro un progetto aperto — vedi `UX-S120` per
export/redaction) — questo task copre solo l'import a livello di workspace. Nessuna
chiamata da documentare qui.

## Undo/Redo (top bar, dentro un progetto aperto)

- Stato dei pulsanti: riflette `CommandStack.canUndo()` / `CommandStack.canRedo()` ad
  ogni render — nessuna chiamata di rete, `CommandStack` opera in memoria sullo stato
  del progetto già caricato.
- Click su Undo → `CommandStack.undo()`, che ripristina lo snapshot precedente e
  aggiorna lo stato applicativo corrente; nessuna persistenza automatica (il
  salvataggio su `ProjectRepository` resta un'azione esplicita separata, coerente con
  `REACT_FLOW_ARCHITECTURE.md`).
- Click su Redo → `CommandStack.redo()`, simmetrico.
- Il tooltip che descrive l'azione (`ui-behavior.md`) legge la descrizione testuale
  del comando in cima allo stack (`CommandStack` conserva il comando, non solo lo
  snapshot, per questo scopo).

## Command palette

- Le voci di navigazione (es. "Vai a: Processing Graph Editor") non chiamano
  l'SDK — sono routing client-side puro.
- Le voci di azione disponibili dipendono dallo stato corrente:
  "Annulla ultima modifica" compare solo se `CommandStack.canUndo()` è vero ed
  esegue lo stesso `CommandStack.undo()` del pulsante in top bar.
  "Nuovo progetto" apre lo stesso dialogo descritto sopra.
- Nessuna chiamata dedicata alla palette stessa: è un'interfaccia sopra comandi già
  descritti altrove in questo file.

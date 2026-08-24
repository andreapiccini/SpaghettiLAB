# S042 — EditorModel, form e compatibility engine

**Stato:** ✅ DONE
**Dipende da:** S041

## Obiettivo

Derivare dal catalogo/topologia normalizzati un modello editabile completo, incluso
cosa può o non può essere collegato, senza hardcodare alcun tipo concreto.

## Implementazione richiesta

1. Costruisci un `EditorModel` puro con node type, input/output handle, property
   schema, unità, enum, default, reference group, capability e permission richieste.
2. Genera form model tipizzati dai field descriptor; distingui required/default,
   integer lossless, bytes, text, enum, reference e unità fixed-point.
3. Implementa compatibility engine per handle/edge basato su schema, tipo, unità,
   semantic/reference group, direzione, Flow/Bay e capability.
4. Gestisci tipi mancanti o versione non disponibile come placeholder diagnostico che
   conserva dati e offre remediation, senza cancellare nodi.

## Verifiche

- catalog order differente produce lo stesso `EditorModel`;
- uno schema incompatibile impedisce la creazione dell'edge con errore strutturato;
- un tipo sconosciuto conserva il progetto e segnala il pack/profile richiesto invece
  di cancellare il nodo.

## Fine task

- [x] Nessun dispositivo o blocco concreto è hardcoded nell'editor.
- [x] Form, handle e vincoli derivano interamente dai descrittori del catalogo.

## Implementazione (2026-08-13)

Nuovo package `@spaghettilab/editor-model`, sopra `@spaghettilab/catalog-model`
(S041) e `@spaghettilab/domain` (per `Result`/`DomainError`), nessun I/O.

### Scostamento onesto ereditato da S041/S021

`buildEditorModel()` produce un `NodeTypeDescriptor` per ogni Module Driver/
Device Profile del catalogo — ma con `handles`/`propertySchema` **vuoti**: il
wire protocol oggi riporta solo `{typeId, commandCount}` per driver, nessun dato
di handle o property schema (stessa lacuna già registrata nella nota di S021 e
nel README di `catalog-model`). Non ho inventato dati finti per riempirli; la
forma è pronta, la logica di form/compatibility è già completa e testata, manca
solo il dato reale dal firmware.

### Cosa è stato implementato

- `editor-model.ts` — `buildEditorModel(catalog, profiles)`: deriva i tipi nodo
  dagli indici normalizzati S041, mai da una lista hardcoded; ordine
  indipendente per costruzione (ereditato da S041 + un riordino proprio).
- `form-model.ts` — `buildFormField`/`buildFormModel`: distingue required/
  default, interi lossless (bigint per valori oltre `Number.MAX_SAFE_INTEGER`,
  regola di S021), bytes/text/enum (richiede opzioni)/reference (richiede
  reference group)/fixed-point (richiede scala) — ogni violazione rifiutata con
  `DomainError` strutturato, `buildFormModel` raccoglie tutti gli errori invece
  di fermarsi al primo (stesso pattern di `validateProjectV1`, S014).
- `compatibility.ts` — `checkHandleCompatibility`/`createEdgeIfCompatible`:
  schema/tipo, unità, semantic/reference group, direzione, un vincolo Flow
  **opt-in** (`requireSameFlow`, mai una regola globale "un edge non può
  attraversare Flow diversi" — non giustificata dall'architettura, una Rule
  legge spesso da un Flow e comanda su un altro), capability (verificata solo
  se il chiamante fornisce l'insieme installato). Ogni rifiuto è un
  `DomainError` con `code` dedicato — mai un booleano nudo (S042 § Verifiche:
  "uno schema incompatibile impedisce la creazione dell'edge con errore
  strutturato").
- `placeholder.ts` — `resolveNodeType()`: un tipo sconosciuto non lancia né
  cancella — restituisce un `PlaceholderDiagnostic` che conserva `rawData`
  verbatim e propone la remediation (S042 § Verifiche: "un tipo sconosciuto
  conserva il progetto ... invece di cancellare il nodo").

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 288
test nel workspace (33 nuovi in `@spaghettilab/editor-model`), build: tutti
verdi.

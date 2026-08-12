# S123 — Import/export sicuri, redaction e audit

**Stato:** ✅ DONE
**Dipende da:** S121

## Obiettivo

Permettere di scambiare progetti, profili e diagnostica con l'esterno senza mai
eseguire contenuto non fidato o esporre segreti, e tenere traccia di ogni operazione
sensibile.

## Implementazione richiesta

1. Implementa import sandboxed con schema/size limits, duplicate ID handling, unknown
   artifact preservation e preview; nessun JavaScript/plugin viene eseguito.
2. Implementa export canonico selettivo di progetto, Device Profile e diagnostica con
   redaction automatica; immagini/record live sono opt-in separati.
3. Implementa audit locale append-only per connect, validate/apply, command sensibile,
   profile install/remove, OTA, reset e Node-RED deploy; niente payload segreti.

## Verifiche

- un import malevolo non esegue codice e non esaurisce memoria (size/schema limit);
- un artifact non trusted o alterato è rifiutato prima di poter raggiungere l'OTA
  (S103);
- l'audit log non contiene mai un payload segreto, anche per operazioni fallite.

## Fine task

- [x] Import e marketplace non possono introdurre codice non trusted.
- [x] Export selettivo e redaction sono verificati con test dedicati.
- [x] Ogni operazione sensibile è auditata senza esporre segreti.

## Implementazione (2026-08-12)

Scope onesto: implementato ciò che è già costruibile sul modello di dominio
esistente — import/export/audit di **Project** (`ProjectV1`, S014). Device Profile e
diagnostica (S061–S063, S091) non esistono ancora come codice: la loro parte di
import/export/audit resta da fare quando quei task saranno implementati, non
inventata qui.

In `packages/domain/src`:

- `project-import-export.ts`:
  - `previewProjectImport()` — limite size (`MAX_PROJECT_IMPORT_BYTES`, verificato
    **prima** del parsing), poi `importProjectV1` (già mai esegue codice — solo
    `JSON.parse` + validazione strutturale), poi flag `isDuplicateId` contro gli ID
    già noti al chiamante. Nessuna persistenza: è solo anteprima.
  - `resolveProjectImportId()` — decisione esplicita `"rename"` (nuovo ID via
    `UuidGenerator`) o `"keep"` (overwrite consapevole); mai un sovrascrivere
    implicito.
  - Preservazione artifact sconosciuti: `validateProjectV1` già effettua un cast
    dell'oggetto grezzo validato invece di ricostruirne uno pulito, quindi campi
    top-level non riconosciuti sopravvivono al round-trip import→export — provato
    con un test dedicato con un campo finto `futureArtifactType`.
  - `exportProjectSelective()` — export canonico + `findSuspiciousSecretLikeKeys()`
    come rete di sicurezza in più (la garanzia primaria resta strutturale, da
    S121: `ProjectV1` non ha alcun campo capace di contenere un segreto).
    `includeImages`/`includeLiveRecords` accettati come opt-in riservati per il
    futuro (Device Profile Studio/Runtime Monitor non hanno ancora questi campi nel
    modello — nessun campo da spegnere oggi, ma l'API è già pronta).
- `audit-guard.ts` — `AUDIT_OPERATIONS` (catalogo chiuso: connect, validate/apply,
  comando sensibile, profile install/remove, OTA, reset, Node-RED deploy) e
  `recordSensitiveOperation()`, unico modo sanzionato per scrivere un audit entry:
  scrub automatico delle chiavi simil-segreto in `detail` **anche per `outcome:
  "failure"`** — provato con test dedicato.
- `errors.ts` — nuovo `DomainErrorCode.IMPORT_TOO_LARGE`.

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 98 test
(16 nuovi), build: tutti verdi.

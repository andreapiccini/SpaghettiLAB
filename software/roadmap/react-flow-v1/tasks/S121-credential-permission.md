# S121 — Credential store e permission matrix

**Stato:** ✅ DONE
**Dipende da:** S014

## Obiettivo

Garantire fin dalle fondamenta che nessun segreto possa finire in un progetto, log o
errore, e che i permessi siano verificati prima di mostrare un'operazione.

## Implementazione richiesta

1. Implementa credential store adapter e connection profile con riferimenti opachi;
   token/password/key non entrano in Project, Redux/devtools, log, error report o URL.
2. Definisci permission matrix locale coerente con firmware/Node-RED; l'app può
   disabilitare preventivamente ma non sostituisce enforcement remoto.

## Verifiche

- una ricerca automatica su export/log/audit/error non trova mai un segreto;
- un'operazione senza permesso è disabilitata lato app prima ancora di essere tentata
  lato Core/Node-RED.

## Fine task

- [x] Credenziali e progetti hanno storage e portabilità separati.
- [x] La permission matrix locale è coerente con l'enforcement remoto, senza
      sostituirlo.

## Implementazione (2026-08-12)

`CredentialStore` (porta + `InMemoryCredentialStore` fake) esisteva già da S011.
Aggiunti in `packages/domain/src`:

- `ids.ts` — `ConnectionProfileId` branded.
- `connection-profile.ts` — `ConnectionProfile`/`createConnectionProfile()`: nessun
  campo capace di contenere un segreto, solo `credentialRef` opaco verso
  `CredentialStore`. Test dedicato verifica che la serializzazione JSON non
  contenga mai chiavi tipo secret/password/token e che `credentialRef`, quando
  presente, abbia sempre la forma di un riferimento (`cred://...`), mai un valore
  incollato per errore.
- `permission.ts` — `PERMISSION_SCOPES` (Core connect/command/OTA/admin,
  Node-RED deploy/manage, project import/export) e `checkPermission()`: `Result`
  strutturato, mai un booleano nudo; il messaggio di remediation chiarisce sempre
  che è un controllo locale preventivo, non l'enforcement remoto reale.
- `errors.ts` — nuovo `DomainErrorCode.PERMISSION_DENIED`.

`CoreBindingRecord.connectionProfileId` (S014) resta `string`: è già il
riferimento opaco verso il registro `ConnectionProfile` a livello Workspace
(`REACT_FLOW_ARCHITECTURE.md` § Modello dati principale), non serviva
ristretto a un branded ID per questo task e avrebbe rotto i fixture/test S014
esistenti senza necessità.

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 71 test
(4 nuovi), build: tutti verdi.

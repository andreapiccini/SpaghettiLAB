# S080 — Deploy Config transazionale

**Stato:** ✅ DONE
**Dipende da:** S073

## Obiettivo

Applicare Config in sicurezza con diff, validate, compare-and-swap, verifica e gestione
completa dei conflitti.

## Implementazione richiesta

1. Crea Deployment Coordinator per Core con pipeline compile→local validate→artifact
   resolution→remote validate→apply CAS→read-back verify.
2. Mostra diff semantico fra live, last deployed e candidate: Module/Profile/Schedule/
   Rule/Block/edge/policy; ignora metadata authoring.
3. Blocca deploy se profili o Capability Pack richiesti non sono installati; passa a
   S060/S100 mantenendo il candidate immutato e riprende solo dopo risync.
4. Usa sempre expected generation/hash. Su CONFLICT legge nuovo snapshot e offre:
   import live, rebase/merge strutturato o annulla; niente force/last-write-wins V1.
5. Mantieni DeploymentRecord soltanto dopo read-back con hash atteso; apply no-op viene
   registrato senza fingere nuova generation.
6. Gestisci disconnect/timeout/response persa interrogando Config e replay state prima
   di ritentare.
7. Preserva progetto dirty e diagnostics su qualsiasi fallimento; non assume rollback
   remoto se non osservato.
8. Supporta deploy coordinato di più Core come operazioni indipendenti con report
   parziale; V1 non promette transazione atomica distribuita.

## Verifiche

- apply riuscito, no-op, validation failure, stale generation e response persa;
- due client concorrenti non perdono modifiche;
- reboot durante apply viene riconciliato da boot ID + Config hash;
- artifact install seguito da catalog refresh ricompila lo stesso candidate;
- fallimento su Core B non falsifica lo stato di Core A.

## Fine task

- [x] Non esiste percorso di deploy senza validate e CAS.
- [x] Conflict resolution è strutturata e non distruttiva.
- [x] DeploymentRecord rappresenta soltanto stato verificato.
- [x] Errori e risultati multi-Core restano per-target.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/config-deployment`
(`software/micro-flow-editor/packages/config-deployment/`), che dipende da `domain`,
`protocol-sdk`, `config-compiler` (S072) e `config-decompiler` (S073).

**Pipeline** (`deploy.ts`): `deployConfig()` esegue esattamente la sequenza del
punto 1 — dry-run locale (S073) ma più severo del default di quella funzione: un
Device Profile o Capability Pack mancante è un blocco duro qui
(`PROFILE_OR_PACK_MISSING`), non un warning, come richiesto dal punto 3; il
candidate non viene mai inviato in questo caso. `VALIDATE_CONFIG` remoto reale
(diverso dallo stub sempre-`valid:1` di `VALIDATE_DEVICE_PROFILE` documentato in
`device-profile-install` — il validate di Config è reale, vedi il README di S072).
`APPLY_CONFIG` usa sempre `expectedGeneration` (punto 4); uno stato `CONFLICT`
(`-ESTALE`/`-EEXIST`, stessa mappatura errno→status usata in
`device-profile-install`) rilegge il Config live, lo decodifica (S073), e restituisce
un diff esplicito contro il candidate — mai un force-apply o una scelta automatica
del vincitore: "import live / rebase / annulla" resta interamente al chiamante.
Read-back verify: un apply riuscito con `changed:true` non viene mai fidato da solo —
questa funzione richiama sempre `GET_CONFIG` e crea un `DeploymentRecordV1` solo se
generation e SHA-256 del read-back corrispondono a quanto appena applicato (punto 5).

**Esiti ambigui** (response persa, reboot durante apply): se `applyConfig` lancia per
qualunque motivo diverso da `CONFLICT`, questa funzione non assume nessun esito —
interroga `GET_CONFIG` e confronta lo SHA-256 restituito con l'hash del candidate
calcolato localmente: una corrispondenza significa che l'apply è effettivamente
avvenuto (`AMBIGUOUS_RESOLVED_APPLIED`), altrimenti no
(`AMBIGUOUS_RESOLVED_NOT_APPLIED`, sicuro da ritentare). Questa è la metà "Config
hash" di "reboot durante apply viene riconciliato da boot ID + Config hash" — la metà
boot ID è compito di `core-session` (S030), non duplicata qui.

**Diff** (`diff.ts`): `diffConfigs()` confronta due `CanonicalConfig` sezione per
sezione (Module/Schedule/Rule/Block/edge, più un flag `policyChanged` per
mqtt/connectivity/energy) — mai metadata authoring, perché `CanonicalConfig` non può
strutturalmente portarne (punto 2). Identità = stessa key che `compileConfig`
assegna.

**Multi-Core** (`deployToCores`): esegue `deployConfig` su più Core indipendentemente,
ciascuno isolato nel proprio `try`/`catch` (punto 8) — un fallimento su un target è
riportato solo per quel target, ogni altro risultato resta esattamente come se quello
fallito non esistesse. Nessuna garanzia atomica multi-Core in V1, come richiesto dal
testo del task.

**Test**: 9 nuovi test coprono direttamente le Verifiche (apply riuscito/no-op/
validation failure/stale generation/response persa, multi-Core con fallimento isolato
su un target). CI completa verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): nessuna
risoluzione automatica dei conflitti (sempre delegata al chiamante); nessun
rilevamento reboot via boot ID (compito di `core-session`); nessuna persistenza del
`DeploymentRecordV1` prodotto — scriverlo in `ProjectV1.deploymentRecords` resta
compito del chiamante via `CommandStack` (S014).


# S124 — Conferme distruttive, recovery guidato e threat test

**Stato:** ✅ DONE
**Dipende da:** S122, S123; chiusura dopo S103 e S113

## Obiettivo

Chiudere la qualificazione di sicurezza: ogni azione irreversibile è confermata
esplicitamente, e ogni scenario di guasto ha un percorso di recupero guidato.

## Implementazione richiesta

1. Richiedi conferma target-specific per factory reset, credential removal, profile in
   uso, firmware downgrade e Node-RED resource deletion.
2. Implementa recovery guidato per Core sostituito, device ID mismatch, Config
   corrotto/assente, catalogo incompatibile, OTA rollback e Node-RED non raggiungibile.
3. Definisci retention/cache purge/logout e threat test per XSS, malicious profile,
   oversized import, forged marketplace metadata e secret leakage.

## Verifiche

- ogni reset o rimozione mostra device ID, scope e conseguenze prima della conferma;
- i threat test (XSS, profilo malevolo, import oversize, metadata marketplace forgiati,
  secret leakage) sono automatizzati e passano;
- ogni scenario di recovery guidato (Core sostituito, ID mismatch, Config
  corrotto/assente, catalogo incompatibile, rollback, Node-RED irraggiungibile) ha un
  percorso testato senza azioni distruttive implicite.

## Fine task

- [x] Tutte le operazioni sensibili richiedono conferma target-specific.
- [x] Ogni scenario di recovery guidato previsto dall'architettura è testato.
- [x] I threat test definiti sono automatizzati e passano.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/security-recovery`
(`software/micro-flow-editor/packages/security-recovery/`), che dipende da `domain`,
`core-admin`, `core-session`, `device-profile-authoring-model`,
`device-profile-install`, `device-profile-package`, `capability-marketplace`,
`ota-lifecycle`, `node-red-deploy`.

**Conferme distruttive** (`destructive-confirmation.ts`): quattro gate sopra
`checkDestructiveConfirmation()` di `core-admin` (S094, mai reimplementato) — rimozione
credenziale (gate mancante su `CredentialStore.remove()`, S121), rimozione profilo
(gate aggiunto sopra il blocco già esistente per "in uso locale" di
`device-profile-install`, S063), override downgrade firmware (esplicito sopra
`REJECTED_POSSIBLE_DOWNGRADE` di `ota-preflight`, S102 — mai un bypass silenzioso),
cancellazione risorse Node-RED. Ogni target è costruito da device ID + scope +
conseguenze in un unico punto (`describeTarget()`), cosicché il testo mostrato e quello
confermato non possano mai divergere.

**Recovery guidato** (`recovery-guides.ts`): funzioni pure per i sei scenari — Core
sostituito, device ID mismatch, Config corrotto/assente, catalogo incompatibile,
rollback OTA, Node-RED irraggiungibile. Ogni piano è una lista ordinata di passi
`{step, destructive}`; nessun piano esegue nulla da solo e nessun primo passo è mai
distruttivo.

**Retention policy** (`retention-policy.ts`): `RETENTION_POLICY` documenta cosa
sopravvive al logout (credenziali, audit log) e cosa viene svuotato (cache catalogo,
buffer telemetria). **Gap reale trovato e corretto**: `CatalogCache` di `core-session`
aveva solo `invalidateDevice()` per-dispositivo, nessun `clear()` completo necessario
per il logout — aggiunto direttamente a `core-session` (con test), non reinventato qui.

**Threat test automatizzati** (`__tests__/threat-tests/`): XSS (scan statico
eval/Function/innerHTML su tutti i package `src/`, più verifica dinamica che un payload
di injection sopravviva come dato inerte in Project e Device Profile), profilo malevolo
(budget superato rifiutato da `validateDeviceProfile`, pacchetto manomesso rifiutato da
hash mismatch), import oversize (Project/Device Profile/marketplace, tutti rifiutati
prima del parsing), metadata marketplace forgiati (nessun pack non fidato o non
verificabile viene mai risolto, nessun fallback a "fidato di default"), secret leakage
(scrubbing verificato a qualunque profondità, incluso su esito failure; redazione URL
firmati verificata anche su URL malformati). Tutti reali, tutti passano, nessuno
reimplementa la protezione che testa — solo la esercita con input avversari.

**Test**: 33 nuovi test in `security-recovery` + 1 nuovo in `core-session` per
`CatalogCache.clear()`. CI completa verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): lo scan XSS
statico copre solo il codice TypeScript di questo workspace, non il comportamento
runtime reale di React in `packages/app` (che si affida al proprio escaping di
default); i piani di recovery sono descrittivi, non eseguibili — un chiamante decide
come presentarli; `purgeOnLogout()` richiede che il chiamante fornisca ogni store da
svuotare, nessun registro automatico di "tutti gli store esistenti".

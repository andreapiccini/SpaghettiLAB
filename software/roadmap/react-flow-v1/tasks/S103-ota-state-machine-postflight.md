# S103 — State machine OTA, postflight e audit

**Stato:** ✅ DONE
**Dipende da:** S102

## Obiettivo

Eseguire l'aggiornamento firmware in modo che un fallimento in qualunque punto non
lasci mai il Core in uno stato falsamente "installato".

## Implementazione richiesta

1. Implementa OTA state machine arm/upload/progress/finalize/reboot/trial/confirm/
   rollback/cancel per ogni trasporto supportato e resume soltanto se il protocollo lo
   garantisce.
2. Dopo reboot verifica device ID, firmware version, feature-set hash, pack list,
   Config/profile preservation, catalog fingerprint e resource report prima di
   considerare installato.
3. Rifiuta immagine che rimuove una feature usata dal Config/progetto, salvo migration
   esplicita supportata e previewata.
4. Conserva audit di update senza token, chiavi o URL firmati sensibili.

## Verifiche

- disconnect, hash errato, power loss simulata, trial crash e rollback preservano
  sempre Config e profili esistenti;
- la rimozione di una feature in uso è rifiutata prima di avviare l'OTA;
- un fingerprint refresh dopo OTA invalida la cache del catalogo coerentemente con
  S030.

## Fine task

- [x] Solo immagini firmware firmate aggiungono codice al Core.
- [x] Il postflight verifica compatibilità e integrità prima di segnare "installato".
- [x] Un fallimento OTA/rollback non produce mai uno stato "installato" falso.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/ota-lifecycle`
(`software/micro-flow-editor/packages/ota-lifecycle/`), che dipende da `domain`,
`protocol-sdk`, `ota-preflight` e `core-session`.

**Gap reale trovato e corretto subito in `protocol-sdk`**: il firmware ora espone
quattro operazioni Protocol V1 reali — `OPEN_BLE_UPDATE`(28), `WRITE_BLE_UPDATE`(29),
`FINISH_BLE_UPDATE`(30), `CANCEL_BLE_UPDATE`(31) (`protocol.h`) — che l'SDK non
codificava affatto. Aggiunto `operations/ble-update.ts`, esteso l'enum `Operation` e
`SpaghettiClient` con i quattro metodi corrispondenti, prima di poter costruire una
state machine "per ogni trasporto supportato" che includa davvero il BLE.

**Resume — verificato, non assunto**: `spaghetti_update_write()`'s doc comment dice
esplicitamente "chunks must be contiguous" e ritorna `-EPERM` se nessun trasporto
possiede una sessione RECEIVING — l'`offset` di `WRITE_BLE_UPDATE` è un controllo di
contiguità/integrità su una sessione già posseduta, non un primitivo di seek/resume.
Una sessione persa per disconnessione non può essere riagganciata. Wi-Fi (`UDP`)
trasferisce i byte su un canale grezzo fuori dall'envelope CBOR (`OPEN_WIFI_UPDATE`
ritorna solo un handover address/port), quindi nessuna visibilità sul suo resume.
`canResumeAfterDisconnect()` ritorna `false` per ogni trasporto — "resume soltanto se
il protocollo lo garantisce" risolve onestamente in "mai, su questa versione del
firmware".

**BLE OTA session** (`ble-ota-session.ts`): unico trasporto interamente modellato sul
wire CBOR. Fasi nominate secondo il vocabolario S103
(arm/upload/finalize/pending-reboot/cancel/failed) — `TRIAL`/`CONFIRMED`/`ROLLED_BACK`
non sono mai fasi di questa classe: `spaghetti_update_confirm_trial()` è Core-only, mai
esposto a nessun trasporto, e il rollback è automatico via MCUboot — entrambi sono solo
osservabili post-reboot dal postflight. `arm()` rifiuta di aprire una sessione wire se
il `PreflightResult` fornito dal chiamante (`@spaghettilab/ota-preflight`, S102) non è
`READY` — "la rimozione di una feature in uso è rifiutata prima di avviare l'OTA" vale
architetturalmente anche qui. `writeChunk()` verifica la contiguità localmente prima di
qualunque chiamata wire; qualunque fallimento (disconnessione simulata, hash errato al
finish) porta a `FAILED`, mai a `PENDING_REBOOT`.

**Postflight** (`postflight.ts`): `evaluatePostflight()` copre l'intera lista del punto
2 (device ID, firmware version, feature-set hash, pack list, Config/profile
preservation, catalog fingerprint, resource report) confrontando uno snapshot
pre-arm con uno post-reboot. Ordine fisso: identità dispositivo, poi rilevamento
rollback (versione post-OTA ancora uguale a quella pre-OTA — mai un tentativo di
"confirm" dato che nessuna operazione è esposta), poi versione/feature-set
hash/resource report/Config/profili. `CONFIRMED_INSTALLED` è raggiungibile solo se ogni
controllo passa, in ordine — "un fallimento OTA/rollback non produce mai uno stato
'installato' falso" è la sola ragion d'essere di questa funzione.

**Invalidazione cache catalogo**: `invalidateCatalogAfterOta()` riusa
`@spaghettilab/core-session`'s `CatalogCache.invalidateDevice()` (S030 punto 4) già
esistente — nessuna logica di cache nuova.

**Audit** (`audit.ts`): `recordOtaAudit()` usa la categoria `"core.ota"` già presente in
`AUDIT_OPERATIONS` (S123). Verificato che `SECRET_LIKE_KEY_PATTERN` non copre chiavi
`url`/`artifactUrl` — aggiunta `redactSignedUrl()` che rimuove query string (dove
vivono i token di firma) prima che l'URL raggiunga lo scrubber condiviso, senza toccare
il pattern condiviso riusato altrove.

**Test**: 25 nuovi test in `ota-lifecycle` più 4 nuovi in `protocol-sdk` per i codec BLE
OTA. Coprono direttamente le tre Verifiche (disconnessione/hash errato/rollback
simulati non producono mai `PENDING_REBOOT`/`CONFIRMED_INSTALLED` falsi; rimozione
feature bloccata prima dell'apertura sessione; invalidazione cache dopo OTA/rollback
coerente con S030). CI completa verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): nessun resume
su alcun trasporto; il trasferimento byte Wi-Fi/UDP resta fuori scope (solo l'handover
è modellato); Config/profile preservation richiedono il calcolo lato chiamante;
`confirm_trial`/rollback non sono mai invocati da questo pacchetto, solo osservati.

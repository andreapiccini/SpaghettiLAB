# S103 — State machine OTA, postflight e audit

**Stato:** ⬜ TODO
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

- [ ] Solo immagini firmware firmate aggiungono codice al Core.
- [ ] Il postflight verifica compatibilità e integrità prima di segnare "installato".
- [ ] Un fallimento OTA/rollback non produce mai uno stato "installato" falso.

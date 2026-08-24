# E071 — Site activation wizard

**Stato:** ⬜ TODO
**Dipende da:** E070, E020
**Blocca:** E090

## Obiettivo

Primo avvio site on-prem: attivazione licenza/package, creazione `site_admin`, apply turnkey.

## Implementazione richiesta

1. Host endpoint `POST /v1/sites/activate` (token monouso o file package).
2. Dashboard schermata `activate` (fase E050+) o web wizard host:
   - scan QR / upload manifest
   - crea primo admin
   - apply visual pack + flows
3. Dopo attivazione: login normale; stack locked down (no open registration).

## Verifiche

- seconda attivazione stesso site rifiutata
- wizard completabile senza CLI

## Fine task

- [ ] Flusso end-to-end documentato + demo compose.

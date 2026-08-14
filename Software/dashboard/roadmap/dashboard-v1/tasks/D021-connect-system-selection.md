# D021 — Connect & system selection

**Stato:** ⬜ TODO
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/connect/`

## Obiettivo

Specificare come l'utente aggiunge o seleziona un **sistema** (generico: URL host,
nome, nessun campo MQTT/PLC visibile).

## Cosa deve coprire

- Lista sistemi salvati; stato connessione per ciascuno.
- Form "Aggiungi sistema": nome + indirizzo host (campo unico opaco).
- Stati: nessun sistema, connessione in corso, errore credenziali, successo.
- Navigazione verso overview dopo selezione.

## Implementazione richiesta

1. `visual.md` — lista card sistema, FAB o pulsante aggiungi, form modale/sheet.
2. `ui-behavior.md` — validazione locale nome non vuoto; feedback tap; nessun SDK.
3. `host-behavior.md` — `GET /v1/systems`, `POST /v1/systems`; errori `offline`,
   `unauthorized`.

## Fine task

- [ ] Tre file spec completi.
- [ ] Riga schermata in `DASHBOARD_ARCHITECTURE.md` marcata come specificata.

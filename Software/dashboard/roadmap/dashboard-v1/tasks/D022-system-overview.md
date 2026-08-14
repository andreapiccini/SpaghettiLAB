# D022 — System overview

**Stato:** ⬜ TODO
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/overview/`

## Obiettivo

Home del sistema selezionato: stato generale, accesso rapido alle pagine dashboard,
allarmi in evidenza.

## Cosa deve coprire

- Header: nome sistema, pillola stato (ok / attenzione / offline).
- Sezione allarmi (0 = messaggio rassicurante).
- Griglia scorciatoie verso pagine layout o widget pin.
- Entry point: canvas, personalizza aspetto, marketplace, impostazioni.

## Implementazione richiesta

1. `visual.md` — layout scroll; card allarme; shortcut tile.
2. `ui-behavior.md` — pull-to-refresh visivo (animazione locale); tap navigazione.
3. `host-behavior.md` — `GET /v1/systems/{id}`; stream `system_status`, `alarm`.

## Fine task

- [ ] Tre file spec completi.

# D024 — Widget picker

**Stato:** ⬜ TODO
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/widget-picker/`

## Obiettivo

Scegliere un **punto esposto** e il tipo widget suggerito; tornare al canvas con
widget aggiunto.

## Cosa deve coprire

- Lista/search punti per label (non ID tecnici).
- Anteprima valore live (fake).
- Suggerimento `widgetHint` pre-selezionato, modificabile.
- Raggruppamento opzionale per "zona" o categoria (stringa host, non firmware).

## Implementazione richiesta

1. `visual.md` — search bar, lista con icona kind, preview valore.
2. `ui-behavior.md` — filtro locale; selezione → conferma → pop navigation.
3. `host-behavior.md` — `GET /v1/systems/{id}/points`.

## Fine task

- [ ] Tre file spec completi.

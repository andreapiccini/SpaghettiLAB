# D025 — Point detail & control

**Stato:** ⬜ TODO
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/point-detail/`

## Obiettivo

Schermata singolo punto: valore grande, unità, controllo se scrivibile, storico
placeholder.

## Cosa deve coprire

- Valore `type.display`, unità, timestamp ultimo aggiornamento.
- Switch/slider/button se `writable`.
- Sparkline storico (dati fake; label "Storico — anteprima").
- Stato offline del punto.

## Implementazione richiesta

1. `visual.md` — hero value, chart area, action bar comando.
2. `ui-behavior.md` — conferma prima comando critico (dialog generico); toggle locale.
3. `host-behavior.md` — `GET points/{id}`, `POST commands/{pointId}`, stream updates.

## Fine task

- [ ] Tre file spec completi.

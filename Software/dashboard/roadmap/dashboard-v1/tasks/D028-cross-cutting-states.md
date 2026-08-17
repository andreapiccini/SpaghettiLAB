# D028 — Stati trasversali

**Stato:** ✅ DONE
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/states/`

## Obiettivo

Specificare componenti riusabili: caricamento, vuoto, offline, errore generico, allarme.

## Cosa deve coprire

- `LoadingView`, `EmptyState`, `OfflineBanner`, `ErrorPanel`, `AlarmChip`.
- Mapping errori host → UI (`offline`, `unauthorized`, `internal`).
- Uso cross-screen (referenced da D021–D027).

## Implementazione richiesta

1. `visual.md` — ogni stato con token e copy italiano neutro.
2. `ui-behavior.md` — retry button animazione; offline banner sticky.
3. `host-behavior.md` — tabella codici errore API → vista.

## Fine task

- [x] Tre file spec completi.
- [x] Widget Flutter riusabili implementati in D051.

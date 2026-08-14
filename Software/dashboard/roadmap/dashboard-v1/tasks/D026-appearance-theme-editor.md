# D026 — Appearance & theme editor

**Stato:** ⬜ TODO
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/appearance/`

## Obiettivo

Editor **grafico** della dashboard: colori, sfondo, profilo animazioni, stile menu —
con anteprima live sul canvas. Cuore della differenziazione vs Arduino Cloud.

## Cosa deve coprire

- Sezioni: **Colori** | **Sfondo** | **Animazioni** | **Menu** | **Brand** (logo shell).
- Picker accent, sfondo app/surface; gradiente o immagine sfondo (picker fake fase 1).
- Profilo motion: subtle / standard / rich.
- Anteprima split o full-screen: canvas con widget demo reagisce in tempo reale.
- Reset "Ripristina default".
- Link testuale (non editor): "Le automazioni si configurano in Node-RED" — informativo.

## Implementazione richiesta

1. `visual.md` — pannelli editor, preview, token override da `THEMING.md`.
2. `ui-behavior.md` — slider/color picker locali; debounce preview; no network in spec.
3. `host-behavior.md` — `GET/PUT appearance`, stream `appearance_updated`.

## Fine task

- [ ] Tre file spec completi.
- [ ] Spec esclude qualsiasi editor regole/automazione.

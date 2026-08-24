# D023 — Dashboard canvas (visual-first)

**Stato:** ✅ DONE
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/canvas/`

## Obiettivo

Cuore visivo fase 1: ViewMode **`cards`** — griglia widget bella, animata,
personalizzabile. Canvas risolve il renderer via **registry** (D031), non hardcode.

## Cosa deve coprire

- Modalità **visualizza** / **modifica** layout.
- Griglia responsive; sfondo da `DashboardAppearance` (gradiente/immagine).
- Widget fase 1: gauge, value, switch, button, status, sparkline, **`animated`**
  (es. pompa: ferma vs rotazione quando `visualState=running`).
- Tap widget → point-detail; long-press in modifica → opzioni widget (tipo visivo).
- Menu placement da appearance (bottom / rail / minimal).
- Empty state con CTA verso widget-picker **e** link "Personalizza aspetto".

## Implementazione richiesta

1. `visual.md` — canvas full-bleed, widget card con motion, esempio pompa/temperatura.
2. `ui-behavior.md` — animazioni legate a valore stream (descritte localmente); reorder.
3. `host-behavior.md` — layout + appearance + stream `point_updated` con `visualState`.

## Fine task

- [x] Tre file spec completi.
- [x] Spec include almeno un widget animato documentato.

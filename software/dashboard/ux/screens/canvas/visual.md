# Canvas — Visual

[← UX](../../README.md) · [UI behavior](ui-behavior.md) · [Host behavior](host-behavior.md)

Cuore visivo fase 1. ViewMode **`cards`**: griglia di widget a tutto schermo,
animata, personalizzabile. Lo sfondo e i colori arrivano da `DashboardAppearance`.
Il canvas **non** decide quando gira una pompa: legge `visualState`.

## Header locale

- Altezza `layout.appBar.height` (56). Sfondo `color.bg.app`.
- Sinistra: titolo pagina layout (`type.heading`), es. "Casa".
- Destra, gap `space.sm`:
  - Segmento **Visualizza / Modifica** (target `layout.touch.min`).
  - Link testuale "Personalizza aspetto" (`color.accent`, `type.caption`).

## Sfondo

- `background.solid` → `color.bg.app` (o override appearance).
- `background.gradient` → lineare top-left → bottom-right, colori appearance.
- `background.image` → cover; fallback solido se manca l’asset.

## Griglia

- Gutter `layout.grid.gutter` (16). Padding `space.md`.
- Card max ~360px; su telefono 1 colonna, tablet 2, desktop 3.
- Ordine = `DashboardLayout.pages[0].widgets`.

## Anatomia card

- Sfondo `color.bg.surface`, bordo 1px `color.border`.
- Raggio: `radius.lg` (28) su tre angoli; basso-sinistra `radius.mark` (0), forma a goccia.
- Padding `space.md`. Titolo `type.title` (label punto). Valore `type.display`. Unità `type.caption` `color.text.secondary`.
- Selezionata / hover: outline 2px `color.accent`.
- Motion valore: `motion.normal` / `easeOutCubic`. Profilo appearance `subtle|standard|rich` scala durata e glow.

## Widget fase 1

| `visualHint` | Look |
|---|---|
| `gauge` | Arco 270° `color.border` + fill `color.accent`; numero al centro |
| `value` | Solo numero + unità, allineato in basso |
| `switch` | Toggle; track `color.ok` acceso |
| `button` | `FilledButton` "Avvia", altezza `layout.touch.min` |
| `status` | Pallino + label OK/Allarme; glow `color.error` se allarme |
| `sparkline` | Mini path `color.accent` su 12 campioni |
| `animated` (pompa) | Impeller 72px. `idle`: fermo, `color.offline`. `running`: rotazione continua, `color.ok` + glow |

## Empty

Se nessun widget: illustrazione corta + "Aggiungi il primo widget" (`color.accent`) e "Personalizza aspetto".

## Vista non-cards

Se `view.kind != cards`: messaggio a centro "Vista non disponibile in questa versione" (`type.body`, `color.text.secondary`). Nessun crash.

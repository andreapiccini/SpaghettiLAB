# Dashboard — Design tokens (bozza fase 1)

Documento vivo: i valori possono essere rifiniti durante D011/D050; ogni schermata
in `dashboard/ux/screens/` deve referenziare **solo** token qui elencati.

## Principi

- Leggibile a distanza (display industriali e telefono).
- Pochi colori semantici; stati chiari (ok / attenzione / errore / offline).
- Dark mode first (kiosk e ambienti factory); light mode opzionale in settings.

## Colori

| Token | Uso | Valore (dark) |
|---|---|---|
| `color.bg.app` | Sfondo app | `#0F1114` |
| `color.bg.surface` | Card, pannelli | `#1A1D23` |
| `color.bg.elevated` | Modali, sheet | `#242830` |
| `color.text.primary` | Titoli, valori | `#F4F5F7` |
| `color.text.secondary` | Label, hint | `#9AA3B2` |
| `color.accent` | Azioni primarie, link | `#3B82F6` |
| `color.ok` | Stato normale | `#22C55E` |
| `color.warn` | Attenzione | `#EAB308` |
| `color.error` | Errore, allarme | `#EF4444` |
| `color.offline` | Disconnesso | `#6B7280` |
| `color.border` | Separatori | `#2E3440` |

Light mode: stessi ruoli semantici; valori da definire in D011.

## Tipografia

| Token | Uso | Spec |
|---|---|---|
| `type.display` | Valore widget grande | 48sp, w600 |
| `type.heading` | Titolo schermata | 22sp, w600 |
| `type.title` | Titolo card | 16sp, w600 |
| `type.body` | Testo corpo | 14sp, w400 |
| `type.caption` | Timestamp, unità | 12sp, w400 |

Font: system default Flutter (`Roboto` / `SF Pro`); nessun font custom in fase 1.

## Spaziatura e raggio

| Token | Valore |
|---|---|
| `space.xs` | 4 |
| `space.sm` | 8 |
| `space.md` | 16 |
| `space.lg` | 24 |
| `space.xl` | 32 |
| `radius.sm` | 8 |
| `radius.md` | 12 |
| `radius.lg` | 16 |

## Layout

| Token | Valore | Uso |
|---|---|---|
| `layout.maxContentWidth` | 1200 | Desktop/web |
| `layout.grid.gutter` | 16 | Canvas widget |
| `layout.touch.min` | 48 | Target minimo tap (kiosk) |
| `layout.appBar.height` | 56 | Barra superiore |

## Animazione

| Token | Valore | Uso |
|---|---|---|
| `motion.fast` | 150ms | Hover, toggle |
| `motion.normal` | 250ms | Transizioni pagina |
| `motion.curve` | `easeOutCubic` | Default |

## Widget (tipi fase 1)

| `visualHint` | Controllo UI |
|---|---|
| `gauge` | Arco o barra + valore numerico animato |
| `value` | Numero + unità, transizione al cambio |
| `switch` | Toggle on/off con motion |
| `button` | Comando singolo |
| `status` | Pillola colore + label; pulse se allarme |
| `animated` | Stato visivo (es. pompa idle/running) — vedi `THEMING.md` |
| `sparkline` | Mini grafico (dati host; fake fase 1) |

Override per sistema: vedi [THEMING.md](THEMING.md).

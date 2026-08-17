# Dashboard — Design tokens (bozza fase 1)

Documento vivo: i valori possono essere rifiniti durante D011/D050; ogni schermata
in `dashboard/ux/screens/` deve referenziare **solo** token qui elencati.

## Principi

- Stile studio chiaro (host editor / React Flow); dark per kiosk e pack.
- Pochi colori semantici; vetro, ombra e raggio uniforme (`radius.lg` su tutti gli angoli).
- Leggibile a distanza.

## Colori

| Token | Uso | Dark | Light |
|---|---|---|---|
| `color.bg.app` | Sfondo app | `#0F1114` | `#F5F6F7` |
| `color.bg.surface` | Card, pannelli | `#1A1D23` | `#FFFFFF` |
| `color.bg.elevated` | Modali, sheet | `#242830` | `#F8F9FC` |
| `color.text.primary` | Titoli, valori | `#F4F5F7` | `#14171F` |
| `color.text.secondary` | Label, hint | `#9AA3B2` | `#4B4F58` |
| `color.accent` | Azioni, nodi | `#3F77DA` | `#3F77DA` |
| `color.ok` | Stato normale | `#1F9D55` | `#1F9D55` |
| `color.warn` | Attenzione | `#B36B00` | `#B36B00` |
| `color.error` | Errore, allarme | `#D6373D` | `#D6373D` |
| `color.offline` | Disconnesso | `#8A8F99` | `#8A8F99` |
| `color.border` | Separatori | `#2E3440` | `#E1E4EB` |

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
| `radius.lg` | 28 | card, chip, pulsanti |
| `radius.mark` | 28 | alias di `radius.lg` |

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

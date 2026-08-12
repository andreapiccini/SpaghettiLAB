# Processing Graph Editor — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata dove si compone il comportamento locale bounded di un Core (schedule → Block
→ Rule → command/publish). Dipende da S071–S073.

**Stato: confermata come "as-built"** — validata con un prototipo React reale
(React + `@xyflow/react` + Motion + Tailwind, generato su Lovable e verificato dal
proprietario del prodotto) il 2026-08-12. Ogni valore sotto è quello effettivamente
implementato e approvato, non una stima — riprodurre esattamente questi numeri.

## Convenzione colore-su-chip

I chip icona (palette, nodo, Inspector) usano il colore categoria con **12% di
opacità** come sfondo, ottenuto appendendo il suffisso esadecimale `1F` al colore hex
a 6 cifre (es. `#3F77DA1F`). Regola generale del design system: `<colore>1F` = 12% di
opacità per sfondi-chip su qualunque colore semantico o di categoria.

## Shell applicativa — valori esatti

### Top bar

- Altezza: **56px** (`h-14`), `border-bottom: 1px solid #E1E4EB`, sfondo `#FFFFFF`,
  padding orizzontale 16px, gap fra i gruppi 16px.
- **Logo**: 28×28px, asset `ux/assets/icon-transparent-28@2x.png` (56×56 reale, 2× per
  retina), nessuno sfondo/badge colorato dietro — l'icona ha canale alpha vero e il
  suo disegno (nero/blu) si legge direttamente su `color.surface` bianco.
- **Wordmark** "SpaghettiLAB": 18px / 600 / line-height 1.3, `font.heading`, colore
  `color.ink`.
- **Pillola stato Core** (centrata): `border-radius: 999px`, bordo 1px `#E1E4EB`,
  sfondo `#F8F9FC`, padding 12px/6px (orizz./vert.), gap interno 8px. Contiene, in
  ordine: label "Core attivo" (12px, `color.ink-faint`) · nome Core (14px/600,
  `color.ink`) · badge di stato: pillola con sfondo `#1F9D55` a 12% opacità, padding
  8px/2px, pallino 6×6px pieno `#1F9D55` + testo 12px `#1F9D55` (es. "IN_SYNC").
- **Pulsante Deploy**: `border-radius: 999px`, sfondo `#3F77DA` (hover `#2E5FBD`),
  padding 16px/8px, testo 14px/600 bianco, badge conteggio: pillola bianca a 22%
  opacità, padding orizzontale 6px, testo 12px.
- **Pulsante overflow** (⋮): 36×36px, `border-radius: 8px`, icona 18px (Lucide
  `MoreVertical`), colore `color.ink-muted`, hover sfondo `#F8F9FC`.

### Left rail

- Larghezza: **64px collassata → 240px espansa**, animata (non a scatto) — vedi
  `ui-behavior.md` per il token di movimento esatto.
- Sfondo `#FFFFFF`, `border-right: 1px solid #E1E4EB`, padding verticale 12px.
- 3 gruppi separati da un divisore: linea 1px `#E1E4EB`, margine orizzontale 12px,
  verticale 8px.
- Ogni voce: margine orizzontale 8px, **altezza 44px**, `border-radius: 8px`, padding
  orizzontale 12px, gap icona-testo 12px.
- Voce attiva: sfondo `color.brand.blue` a 10% opacità, testo/icona `color.brand.blue`.
  Voce inattiva: testo/icona `color.ink-muted`.
- Icona: 18px, stroke 2px.
- Etichetta: 14px, visibile solo da espansa (non solo nascosta via CSS — il testo non
  è renderizzato affatto quando collassata, per evitare reflow/troncamenti strani).
- Pulsante espandi/comprimi in fondo (`mt-auto`, stessa riga da 44px): icona
  `ChevronRight` 18px che ruota 180° quando espanso, colore `color.ink-faint`.

**Elenco esatto delle 11 voci**, in 3 gruppi:

| Gruppo | Icona Lucide | Etichetta |
|---|---|---|
| Composizione | `Network` | Core Connections |
| Composizione | `Boxes` | Catalog & Topology |
| Composizione | `Blocks` | Physical Composition |
| Composizione | `Cpu` | Device Profile Studio |
| Comportamento | `Workflow` | Processing Graph *(attiva su questa schermata)* |
| Comportamento | `GitCompare` | Deploy & Diff |
| Comportamento | `Activity` | Runtime & Diagnostics |
| Estensioni | `Store` | Capability Marketplace |
| Estensioni | `Share2` | Cross-Core Automation |
| Estensioni | `Settings` | Settings & Security |

## Node Palette — valori esatti

- Larghezza fissa **260px**, `border-right: 1px solid #E1E4EB`, sfondo `#FFFFFF`.
- Casella ricerca: contenitore con padding 12px; pillola interna `border-radius: 999px`,
  bordo 1px `#D7DBE3`, sfondo `#F8F9FC`, padding 12px/8px, gap 8px, icona `Search` 14px
  `color.ink-faint`, placeholder "Cerca blocchi".
- **Riga categoria** (header accordion): altezza **40px**, larghezza piena,
  `border-radius: 8px`, padding orizzontale 8px, gap 8px. Contiene: chevron 14px che
  ruota -90° da chiusa · pallino colore categoria 8×8px pieno · label 14px/600 · badge
  conteggio 12px `color.ink-faint`. Categoria senza risultati: disabilitata, opacità
  45%.
- Espansione/collasso categoria: altezza `0→auto`, non spring — **durata 200ms,
  easing `cubic-bezier(0.22,1,0.36,1)`** (l'unica animazione della schermata che non
  usa uno spring, per un motivo preciso: l'altezza "auto" con spring produce jank,
  meglio duration su questo caso specifico).
- **Riga blocco**: margine sinistro 16px, altezza **44px**, `border-radius: 8px`,
  padding orizzontale 8px, gap 8px, cursore `grab`/`grabbing` durante il drag. Chip
  icona 24×24px, `border-radius: 8px`, sfondo colore-categoria a 12% opacità, icona
  14px colorata. Titolo 14px/400, sottotitolo 12px `color.ink-faint`.

### Set di blocchi placeholder (11, tutti finti)

| Categoria | Colore | Icona | Blocchi |
|---|---|---|---|
| Trigger | `#7C5CFC` | `Zap` | Schedule ("ogni 30s") · Event source ("bus locale") |
| Lettura | `#3F77DA` | `Radio` | Module read ("1 modulo") · Device Profile sample ("campionamento") |
| Elaborazione | `#0EA5A0` | `SlidersHorizontal` | Filter ("passa-basso") · Scale ("lineare") · Kalman ("1D") |
| Logica | `#B36B00` | `GitBranch` | Rule ("soglia") · Condition ("if / else") |
| Uscita | `#1F9D55` | `Send` | Publish ("topic MQTT") · Command target ("attuatore") |

### Matrice di compatibilità (finta, solo per l'anteprima)

`trigger`→(lettura, elaborazione, logica) · `lettura`→(elaborazione, logica, uscita) ·
`elaborazione`→(elaborazione, logica, uscita) · `logica`→(logica, uscita) ·
`uscita`→(nessuna). Un nodo Uscita non può mai essere sorgente di un collegamento.

## Anatomia del nodo sul canvas — valori esatti

- Larghezza fissa **224px**, `display: flex`, `border-radius: 12px`, `overflow: hidden`,
  sfondo `#FFFFFF`.
- Bordo: **selezionato** = outline 2px `#3F77DA`, offset 0. **Non selezionato** =
  outline 1px `#E1E4EB`, offset -1px (trucco per non spostare il layout quando cambia
  spessore).
- Ombra: **a riposo** = `elevation.1`, **selezionato o in hover** = `elevation.2`.
- Barra sinistra: 3px piena, alta quanto il nodo, colore categoria, `flex-shrink: 0`.
- Riga contenuto: `gap: 12px`, padding 12px/8px (orizz./vert.).
- Chip icona: 24×24px, `border-radius: 8px`, sfondo colore-categoria a 12% opacità,
  icona 16px stroke 2px colorata.
- Titolo: 14px/600/line-height 1.5, `color.ink`, troncato con ellissi.
- Sottotitolo: 12px/line-height 1.4; normale `color.ink-muted`, oppure — se il nodo ha
  un problema (es. input obbligatorio mancante) — `#B36B00` con icona `TriangleAlert`
  11px davanti al testo.
- **Handle**: area cliccabile 12×12px, centrata su un pallino visivo 8×8px, bordo 2px.
  - Idle: bordo `#D7DBE3`, riempimento bianco.
  - Compatibile (durante un collegamento in corso): bordo+riempimento `#1F9D55`, scala
    1.3×.
  - Errore (drop rifiutato): bordo+riempimento `#D6373D`, pulsa scala `1→1.15→1`.
  - Handle di ingresso: offset -5px a sinistra. Handle di uscita: offset -5px a destra.

## Collegamenti (edge) — valori esatti

- Hit-area invisibile larga 16px (per rendere facile hover/click su una linea sottile)
  sovrapposta al path visibile.
- Path visibile: colore `#8A8F99` a riposo, `#4B4F58` in hover, `#3F77DA` se
  selezionato, `#D6373D` se in errore (con `stroke-dasharray: "6 4"`, tratteggiato
  solo in questo stato). Spessore 1.5px a riposo/selezionato, 2px in hover o errore.
- Curva: bezier standard di React Flow (`getBezierPath`), nessuna curvatura custom.

## Header di schermata — valori esatti

- Altezza **56px**, `border-bottom: 1px solid #E1E4EB`, sfondo `#FFFFFF`, padding
  orizzontale 16px, gap 12px.
- Selettore Core: gap 6px, padding 8px/4px, `border-radius: 8px`, hover sfondo
  `#F8F9FC`; contenuto: label "Core" 12px faint, nome 14px/600 ink, `ChevronDown` 14px.
- Titolo graph: 18px/600, es. `Graph "Flow 1"`.
- Pulsante overflow: 32×32px, `border-radius: 8px`, icona `MoreHorizontal` 16px.
- Gruppo destro (`margin-left: auto`, gap 8px):
  - **Dry-run**: pillola bordo 1px `#D7DBE3`, padding 12px/6px, icona `PlayCircle`
    16px + testo 14px, hover sfondo `#F8F9FC`.
  - **Badge errori**: pillola sfondo `#D6373D` a 10% opacità, padding 12px/6px, icona
    `CircleAlert` 14px + testo 14px colore `#D6373D` (es. "2 errori").
  - **Invia a Deploy**: pillola sfondo `#3F77DA` (hover `#2E5FBD`), padding 16px/8px,
    testo 14px/600 bianco.

## Canvas — valori esatti

- Sfondo `#F5F6F7`. Pattern a punti: passo 20px, dimensione punto 1.5px, colore
  `#D7DBE3`.
- **Minimappa**: angolo in basso a destra, sfondo bianco, bordo 1px `#E1E4EB`,
  `border-radius: 12px`, `elevation.1`, maschera `rgba(245,246,247,.75)`, colore nodo
  = colore categoria, pan/zoom abilitati.
- **Controlli zoom**: in basso a sinistra, verticali, `border-radius: 12px`, bordo 1px
  `#E1E4EB`, sfondo bianco, `elevation.1`, `overflow: hidden`. 4 pulsanti da 36×36px
  separati da bordo 1px (tranne l'ultimo), icona 15px, hover sfondo `#F8F9FC`: `Plus`
  (zoom in, 200ms) · `Minus` (zoom out, 200ms) · `Maximize2` (fit view, 300ms) ·
  `Lock` (placeholder, nessuna azione).
- **Indicatore di drop** (durante il drag di un blocco dalla palette): riquadro
  224×48px tratteggiato 2px `color.brand.blue`, sfondo `color.brand.blue` a 8%
  opacità, `border-radius: 12px`, posizionato sulla cella di griglia (20px) più vicina
  al cursore.
- **Stato vuoto**: icona `Workflow` 48px stroke 1.5px `color.ink-faint` centrata,
  sotto "Nessun blocco ancora" (18px/600), sotto una pillola non cliccabile (stile
  identico al pulsante Deploy ma opacità 70%, `pointer-events: none`) "Trascina un
  blocco dalla palette per iniziare".
- **Toast** (dopo eliminazione): angolo in basso a sinistra (16px dai bordi, sopra la
  status bar), `border-radius: 12px`, bordo 1px `#E1E4EB`, sfondo bianco,
  `elevation.2`, padding 16px/12px, gap 12px. Testo 14px + pulsante testuale "Annulla"
  14px/600 `color.brand.blue`. Auto-dismiss dopo 5000ms.

## Status bar — valori esatti

- Altezza **40px**, `border-top: 1px solid #E1E4EB`, sfondo bianco, padding
  orizzontale 16px, gap 12px.
- Pallino stato 8×8px pieno (colore = stato aggregato: `#1F9D55` valido, `#B36B00`
  warning, `#D6373D` errore).
- Testo conteggio 12px `color.ink-muted` (es. "3 warning, 1 errore").
- Hash compilato: `font.mono` 13px `color.ink-faint` (es. "hash: a3f1c9e2…").
- Conteggio nodi/edge: `margin-left: auto`, `font.mono` 13px `color.ink-faint` (es.
  "5 nodi · 3 edge").

## Inspector — valori esatti

- Larghezza fissa **320px**, `border-left: 1px solid #E1E4EB`, sfondo bianco.
- Header: altezza **56px**, `border-bottom: 1px solid #E1E4EB`, padding orizzontale
  16px, titolo 18px/600, pulsante chiudi 32×32px `border-radius: 8px` icona `X` 16px.
- Corpo: padding 16px, gap **24px** fra i campi (vista nodo singolo) o **8px** fra le
  azioni (vista selezione multipla).
- Riga identità nodo: chip icona 24×24px (stesso stile del nodo), nome 18px/600,
  categoria 12px faint sotto.
- **Campo testo** (Nome blocco): altezza 40px, larghezza piena, `border-radius: 8px`,
  bordo 1px `#D7DBE3`, padding orizzontale 12px, 14px, bordo `color.brand.blue` on
  focus.
- **Campo numerico** (Soglia 0–100): stessa dimensione, `font.mono` 13px, bordo
  dinamico — `#D6373D` se il valore non è un numero valido fra 0 e 100, altrimenti
  `#D7DBE3`; messaggio di errore 12px `#D6373D` sotto il campo quando invalido.
- **Campo di sola lettura** (Sorgente): `border-radius: 8px`, bordo 1px `#E1E4EB`,
  sfondo `#F8F9FC`, padding 12px/8px, `font.mono` 13px `color.ink-muted`, valore finto
  tipo `core://greenhouse-01/{id-nodo}`.
- **Pulsante azione** (Elimina nodo / Allinea selezione): altezza 44px, bordo 1px
  `#E1E4EB`, `border-radius: 8px`, padding orizzontale 12px, gap 8px, 14px; variante
  pericolosa (Elimina) testo `#D6373D`, altrimenti `color.ink`; hover sfondo
  `#F8F9FC`.
- **Vista selezione multipla**: header "N nodi selezionati", corpo con solo due
  pulsanti azione (Allinea selezione, Elimina selezione).

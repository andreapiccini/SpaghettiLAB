# Processing Graph Editor — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata dove si compone il comportamento locale bounded di un Core (schedule → Block
→ Rule → command/publish). È l'evoluzione diretta del prototipo attuale in
[`micro-flow-editor`](../../../micro-flow-editor/). Dipende da S071–S073.

## Layout

Dentro l'area di contenuto principale della shell (vedi `UX_ARCHITECTURE.md`), tre
colonne:

```text
┌──────────────┬──────────────────────────────────────────┬────────────────┐
│              │ Header schermata (56px)                   │                │
│              │  [Core: nome ▾] Graph "Flow 1"  [⋯]        │                │
│              │  [Dry-run] [● 2 errori] [Invia a Deploy]   │                │
│  Node        ├──────────────────────────────────────────┤                │
│  Palette     │                                            │   Inspector    │
│  (260px)     │              Canvas                       │   (320px,      │
│              │                                            │   solo se      │
│  [ricerca]   │                                            │   selezione)   │
│  ▾ Trigger   │                                            │                │
│  ▾ Lettura   │                                            │                │
│  ▾ Elabora   │                                            │                │
│  ▾ Logica    │                                            │                │
│  ▾ Uscita    │                                            │                │
│              ├──────────────────────────────────────────┤                │
│              │ Status bar: "Valido" / "3 warning, 1 errore" · hash: a3f1…  │
└──────────────┴──────────────────────────────────────────┴────────────────┘
```

- **Node Palette** (sinistra, 260px, sempre visibile): sostituisce il pannello
  "PALETTE" di Node-RED con una versione propria. Campo ricerca in cima
  (`radius.pill`, come da token). Sotto, categorie collassabili (accordion), ognuna
  con pallino colore categoria + nome + conteggio blocchi disponibili.
- **Canvas** (centro, resto dello spazio): sfondo `color.surface-sunken` con griglia a
  punti (stesso stile del prototipo attuale). Controlli zoom in basso a sinistra
  (invariati dal prototipo: `+`, `-`, fit-to-view, lock).
- **Inspector** (destra, 320px, appare solo con un nodo/edge selezionato — altrimenti
  quello spazio torna al canvas).
- **Status bar** (footer della colonna centrale, 40px): stato di validazione
  aggregato + hash del Config compilato più recente, in `type.mono`.

## Anatomia di un nodo sul canvas

```text
┌─────────────────────────────────┐
│▎ [icona]  Nome blocco            │  ← barra sinistra 3px, colore = categoria
│▎          Sottotitolo/stato      │
└─────────────────────────────────┘
  ○ input handle (sinistra)   output handle (destra) ○
```

- Card `radius.md`, `elevation.1` a riposo, `elevation.2` su hover/selezione.
- Barra sinistra 3px piena, colore preso dalla categoria (vedi tabella sotto) — stesso
  principio già validato nel tema Node-RED per distinguere "nodi hardware" da
  "nodi generici": qui distingue le 5 categorie di block.
- Icona (Lucide, 16px) dentro un chip 24×24px con sfondo colore categoria al 12% di
  opacità.
- Titolo in `type.body-strong`, sottotitolo in `type.caption` e `color.ink-muted`
  (es. "3 proprietà impostate" oppure, se manca un input obbligatorio,
  "⚠ input mancante" in `color.warning`).
- Handle: cerchi 8px, bordo 2px `color.border-strong`, riempimento `color.surface`;
  quando compatibili con un collegamento in corso diventano `color.success` pieno.

## Categorie e colori

| Categoria | Token colore | Icona Lucide | Esempio blocco |
|---|---|---|---|
| Trigger | `#7C5CFC` (viola, non nel set principale — solo per categoria) | `zap` | Schedule, Event source |
| Lettura | `color.brand.blue` | `radio` | Module read, Device Profile sample |
| Elaborazione | `#0EA5A0` (teal, solo categoria) | `sliders-horizontal` | Filter, Scale, Kalman |
| Logica | `#B36B00` (= `color.warning`, riuso intenzionale: "se sbagli qui il comportamento cambia") | `git-branch` | Rule, condition |
| Uscita | `#1F9D55` (= `color.success`, riuso intenzionale: "punto in cui succede qualcosa nel mondo reale") | `send` | Publish, Command target |

I due colori riusati (Logica=warning, Uscita=success) sono una scelta deliberata, non
un caso: comunicano "qui la decisione conta" e "qui l'azione ha effetto fisico" anche
a chi non legge le etichette.

## Edge (collegamenti)

- Curva bezier, 1.5px, colore `color.ink-faint` a riposo.
- Al passaggio del mouse: `color.ink-muted`, 2px.
- Se il compilatore (S072) segnala un errore su quell'edge: tratteggiata,
  `color.error`, con un badge numerico rosso a metà edge che apre l'errore
  nell'Inspector al click.

## Stati della schermata

- **Vuoto** (nessun nodo nel graph): canvas mostra illustrazione centrale (icona
  `workflow`, 48px, `color.ink-faint`), testo "Nessun blocco ancora" (`type.heading`) e
  bottone primario "Trascina un blocco dalla palette per iniziare" (non cliccabile, è
  un hint, non una CTA — l'azione è il drag, non un click).
- **Caricamento** (EditorModel/graph non ancora arrivati): skeleton di 3 card
  placeholder sul canvas, palette con righe skeleton.
- **Errore di caricamento** (Core irraggiungibile, catalogo non sincronizzato):
  banner in cima al canvas, `color.error` su sfondo `color.surface`, bordo sinistro
  4px `color.error`, testo esplicito + azione "Riprova" o "Vai a Core Connections".

# Project/Workspace Shell — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Copre due cose distinte, entrambe di competenza di questo task: **(1)** la schermata
che precede l'apertura di un progetto (il "project picker"), e **(2)** l'estensione
della top bar standard (definita in `UX_ARCHITECTURE.md` § Shell applicativa) con i
controlli undo/redo e la command palette, visibili invece *dentro* un progetto aperto.
Dipende da S011–S014.

## 1. Project Picker (schermata iniziale, nessun progetto ancora aperto)

**Non usa la shell a tre colonne standard** (niente top bar con Core/Deploy, niente
left rail, niente Inspector) — prima di aprire un progetto non esiste ancora un Core
attivo o una schermata di lavoro a cui quella chrome si riferirebbe.

```text
┌─────────────────────────────────────────────────────────────────┐
│ [Logo+wordmark]                              [Import] [⚙]        │  64px
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│   [cerca progetti...]                          [+ Nuovo progetto] │
│                                                                    │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│   │  Progetto  │  │  Progetto  │  │  Progetto  │   ...griglia     │
│   │  A         │  │  B         │  │  C         │                 │
│   └────────────┘  └────────────┘  └────────────┘                 │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
```

- **Header**: altezza 64px, padding orizzontale 24px (`space.6`), sfondo
  `color.surface`. A sinistra `ux/assets/logo-full.png` (qui, a differenza del badge
  28px nella shell standard, è il momento "vetrina" in cui il wordmark completo ha
  senso — non solo l'icona). A destra: pulsante "Import" (icona Lucide `Upload`,
  stile secondario) e icona impostazioni (`Settings`, 36×36px, `radius.sm`).
- **Barra di ricerca**: pillola (`radius.pill`), bordo `color.border-strong`, sfondo
  `color.surface-raised`, larghezza 320px, icona `Search` 14px. Filtra i progetti per
  nome, client-side.
- **"+ Nuovo progetto"**: pulsante primario pillola, sfondo `color.brand.blue`,
  icona `Plus` + testo, allineato a destra della barra di ricerca.
- **Griglia progetti**: card larghe 240px, alte 140px, gap 16px (`space.4`),
  `radius.md`, `elevation.1` a riposo/`elevation.2` in hover, sfondo `color.surface`,
  bordo `color.border`. Contenuto di ogni card: nome progetto (`type.body-strong`),
  numero di Core collegati come pillola piccola (`type.caption`, sfondo
  `color.surface-raised`), e nessuna anteprima grafica del contenuto (nessun
  thumbnail — il progetto non ha ancora un canvas renderizzabile a freddo).

### Stati

- **Vuoto** (nessun progetto nel workspace): l'intera area sotto l'header usa lo
  sfondo con i glow decorativi (`UX_ARCHITECTURE.md` § Asset decorativi — uno dei
  pochi punti "vetrina" dell'app in cui sono ammessi), icona `FolderPlus` 48px
  `color.ink-faint` centrata, titolo "Nessun progetto ancora" (`type.display`),
  sottotitolo (`type.body`, `color.ink-muted`) e il pulsante primario "Crea il tuo
  primo progetto" centrato sotto.
- **Caricamento**: skeleton di 3 card placeholder (stesse dimensioni, sfondo
  `color.surface-raised` pulsante verso `color.border`).
- **Errore** (storage non raggiungibile): banner sotto l'header, bordo sinistro 4px
  `color.error`, testo esplicito + azione "Riprova".
- **Popolato**: griglia come sopra.

## 2. Estensione della top bar standard: undo/redo e command palette

Dentro un progetto aperto (qualunque delle altre schermate), la top bar descritta in
`UX_ARCHITECTURE.md` § Shell applicativa si estende così, fra il logo/wordmark e
l'indicatore Core attivo:

```text
[Logo 28px]  [↶] [↷]  │  [Core attivo: nome · stato]      [Deploy] [⋮]
```

- **Undo/Redo**: due pulsanti 36×36px adiacenti (gap 4px), `radius.sm`, icone Lucide
  `Undo2`/`Redo2` 18px. Stato abilitato: `color.ink-muted`, hover
  `color.surface-raised`. Stato disabilitato (`canUndo()`/`canRedo()` falso): opacità
  40%, `cursor: not-allowed`, nessun hover.
- Un separatore verticale sottile (1px, `color.border`, alto 24px) fra i pulsanti
  undo/redo e l'indicatore Core, per non farli sembrare parte dello stesso gruppo.
- **Menu overflow (`⋮`)**: prima riga = switch "Modalità avanzata" (persistito,
  default base). Spec completa: [`S125-simple-advanced-mode`](../S125-simple-advanced-mode/visual.md).

## 3. Command palette

Overlay centrato, non un pannello fisso — si apre sopra qualunque schermata.

```text
┌───────────────────────────────────────────┐
│  🔍  Cerca un comando o una schermata...   │  ← input, 48px alto
├───────────────────────────────────────────┤
│  Vai a: Core Connections                    │
│  Vai a: Processing Graph Editor             │
│  Annulla ultima modifica          ⌘Z        │  ← risultati filtrati
│  Nuovo progetto                             │
└───────────────────────────────────────────┘
```

- Contenitore: 560px di larghezza, centrato orizzontalmente, 96px dal top,
  `radius.lg`, `elevation.3`, sfondo `color.surface`. Overlay di sfondo
  `rgba(20,23,31,.35)` (stesso valore usato per i dialoghi modali).
- Campo di ricerca: 48px alto, bordo inferiore 1px `color.border`, nessun bordo
  laterale/pillola qui (è un search-as-you-type in testa a un pannello, non un
  filtro di lista come quello della Palette in S070).
- Righe risultato: 44px alte, icona a sinistra (categoria del comando), testo
  `type.body`, scorciatoia a destra in `type.caption`/`color.ink-faint` quando
  esiste. Riga evidenziata (navigazione da tastiera): sfondo `color.surface-raised`.

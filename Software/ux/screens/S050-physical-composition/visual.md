# Physical Composition Editor — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Editor con cui si rappresenta cosa è **fisicamente** collegato a un Core:
`Backbone → Power → Connector/Bay → Core → Bay/Connector`. Usa la shell a tre
colonne standard (`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva nel left
rail: `Blocks` / "Physical Composition". Dipende da S050.

**Differenza deliberata dal Processing Graph Editor (S070)**: qui il grafo
rappresenta hardware reale, non logica — i nodi non sono "block" colorati per
categoria di comportamento, ma card più sobrie con un'icona di tipo hardware, più
vicine visivamente a un diagramma di cablaggio che a un flow di automazione.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`, stesso pattern del Selettore Core di S070.
- Titolo "Physical Composition" (`type.heading`).
- Gruppo destro (`margin-left: auto`, gap `space.2`):
  - **Candidati** (pillola, bordo 1px `color.border-strong`, icona `Radar` 16px +
    testo "3 candidati" quando `> 0`, altrimenti nascosta) — apre il tray discovery
    (vedi sotto).
  - **Badge collisioni**: pillola sfondo `color.error` 10%, icona `CircleAlert`
    14px, testo `color.error` (es. "2 indirizzi in conflitto"), visibile solo se
    `> 0` — stesso stile del badge errori di S070.
  - **Invia a Deploy**: identico a S070 (pillola `color.brand.blue`, hover
    `color.brand.blue-dark`).

## Canvas — tipi di nodo hardware

Ogni tipo ha un colore di categoria proprio (usato per la barra laterale 3px del
nodo e il chip icona a 12% opacità, stessa convenzione `<colore>1F` di S070), ma
**il nodo stesso non è un "block"**: niente handle di logica, niente riga
input/output multipla — solo punti di attacco fisico dove il cablaggio lo consente.

| Tipo | Colore | Icona | Nota |
|---|---|---|---|
| Backbone | `#8A8F99` | `Rows3` | Nodo largo orizzontale (non quadrato come gli altri) — rappresenta la struttura fisica (compatta/DIN/altro), mai un'assunzione elettrica |
| Power | `#B36B00` | `Zap` | Porta sempre il badge `ENFORCED`/`UNVERIFIED` (vedi sotto) |
| Core | `#3F77DA` | `Cpu` | Al massimo un nodo Core per schermata (il Core selezionato nell'header) |
| Function Bay | `#7C5CFC` | `Layers` | Nome dichiarato dal Core, mai un indice generico |
| Connector | `#0EA5A0` | `Plug` | Separato dalla Bay — cambiare connettore/pinout non trasforma automaticamente l'interfaccia elettrica |
| Dispositivo esterno | `#1F9D55` | `Thermometer` | Icona generica "dispositivo"; contiene la lista Module (vedi sotto) |

**Anatomia nodo standard** (Power/Core/Function Bay/Connector/Dispositivo
esterno): stessa struttura di S070 § Anatomia del nodo (larghezza 224px,
`radius.md`, barra laterale 3px, chip icona 24×24px, titolo 14px/600 troncato,
sottotitolo 12px col tipo), bordo/ombra identici (selezionato = outline 2px
`color.brand.blue`; riposo = outline 1px `color.border`).

**Nodo Backbone**: stessa anatomia ma larghezza libera (si adatta al numero di
elementi collegati, minimo 224px), orientamento orizzontale, icona/titolo
allineati a sinistra invece che in riga con gli handle.

### Badge Power `ENFORCED`/`UNVERIFIED`

Pillola sul nodo Power, stesso stile e stessi due valori già introdotti in
`ux/screens/S040-catalog-topology/visual.md` — **mai normalizzati l'uno
nell'altro**: un power passivo dichiarato `UNVERIFIED` dal Core non deve mai
apparire come `ENFORCED` solo perché "probabilmente va bene".

### Lista Module dentro un nodo Dispositivo esterno / Connector

Sezione espandibile in fondo al nodo (sotto il contenuto standard), separata da un
bordo superiore 1px `color.border`:

- **Riga Module**: altezza 32px, padding orizzontale `space.2`, gap `space.2`.
  Chip 16×16px (icona `Microchip`), nome Module (`type.caption` `type.body-strong`
  in 12px), indirizzo `type.mono` 11px `color.ink-faint` a destra (es. `0x48`).
  Riga in collisione: sfondo `color.error` 8%, icona `TriangleAlert` 11px prima
  del nome al posto del chip.
- **Riga "+ Aggiungi Module"**: stesso stile riga, testo `color.brand.blue`,
  icona `Plus` 14px.

## Configurazione Module (Inspector)

Click su una riga Module apre l'Inspector standard (320px, stesso stile di S070 §
Inspector) con form generato da schema (`EditorModel`, stessa logica di S042 già
usata per il Processing Graph Editor):

- Riga identità: chip 24×24px, nome Module, sottotitolo driver/profile.
- Campi (stesso stile campo testo/numerico/enum di S070 § Inspector, stessa
  regola "bordo `color.error` + messaggio sotto il campo quando invalido, prima
  di qualunque chiamata al backend"): Driver/Profile (sola lettura, da catalogo),
  Port (select), Bay (select), Power rail (select), Endpoint, Indirizzo
  (`font.mono`, con badge collisione inline se in conflitto), Chip-select
  (opzionale, solo se il transport lo richiede), Modalità elettrica (select),
  più eventuali proprietà aggiuntive schema-driven (stesso principio "form
  deriva interamente dal descrittore", nessun campo hardcoded).
- **Banner collisione** (in cima al form, sopra i campi, quando l'indirizzo
  scelto è in conflitto): bordo sinistro 4px `color.error`, sfondo `color.error`
  8%, testo "Indirizzo 0x48 già usato da {altro Module} sulla stessa Port" — la
  stessa convenzione di errore strutturato di `UX_ARCHITECTURE.md` § Convenzioni
  cross-cutting (cosa, su cosa, azione di recupero: "Cambia indirizzo" scrolla al
  campo).

## Tray "Candidati rilevati" (discovery)

Pannello che scivola da destra, 360px, `border-left: 1px solid color.border`,
sfondo `color.surface`, `elevation.2` — non un dialogo modale (si può lasciare
aperto mentre si lavora sul canvas), stesso principio del tray descritto in
`UX_ARCHITECTURE.md` per pannelli laterali.

- Header: titolo "Candidati rilevati" (`type.heading`), pulsante chiudi 32×32px.
- **Card candidato**: `radius.md`, bordo 1px `color.border`, padding `space.3`,
  gap `space.2`.
  - Nome proposto + tipo (`type.body-strong` + `type.caption`).
  - **Badge confidenza**: pillola, "Alta" `color.success` 12%, "Media"
    `color.warning` 12%, "Bassa" `color.error` 12%.
  - **Badge authority**: `type.caption` `color.ink-faint`, es. "dichiarato dal
    Core" o "euristica di discovery" — distingue la fonte, mai presentata come
    certezza uniforme.
  - **Anteprima diff**: elenco compatto `type.mono` 12px di cosa verrebbe
    aggiunto (es. "+ Module su Port 2, indirizzo 0x40, Bay `sensori-esterni`").
  - Due pulsanti affiancati 36px alti: "Rifiuta" (bordo `color.border-strong`,
    testo `color.ink`) e "Accetta" (sfondo `color.brand.blue`, testo bianco) —
    stesso peso visivo, nessuno dei due preselezionato/evidenziato come default,
    per non suggerire un'azione automatica.
- Stato vuoto del tray: icona `Radar` 40px `color.ink-faint`, testo "Nessun
  candidato al momento" (`type.body` `color.ink-muted`).

## Canvas — sfondo e controlli

Stesso sfondo puntinato, minimappa e controlli zoom di S070 § Canvas (`#F5F6F7`,
passo 20px, minimappa in basso a destra, controlli zoom in basso a sinistra) — con
colore nodo minimappa = colore del tipo hardware invece che categoria di
comportamento.

## Status bar

Stesso layout di S070 § Status bar (40px, pallino stato aggregato, hash
compilato `font.mono`), con il conteggio a destra che mostra elementi fisici
invece di nodi/edge (es. "6 Module · 2 conflitti").

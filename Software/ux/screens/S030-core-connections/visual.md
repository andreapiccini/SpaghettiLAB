# Core Connections — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata dove si connettono, identificano e sincronizzano i Core del progetto. Usa la
shell a tre colonne standard (`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva
nel left rail: `Network` / "Core Connections". Nessun Inspector: questa schermata non
ha selezione contestuale nel senso del Processing Graph Editor. Dipende da S030.

Stati di dominio da distinguere visivamente in ogni riga, entrambi presi da
`REACT_FLOW_ARCHITECTURE.md` § Stato di una sessione Core, mai fusi in un unico
badge:

- **Stato di sessione** (connessione in corso): `DISCONNECTED → CONNECTING →
  AUTHENTICATING → SYNCHRONIZING → READY`, con i sottostati di `READY`:
  `VALIDATING`, `APPLYING → READY | CONFLICT | ERROR`,
  `UPDATING → REBOOTING → TRIAL → READY | ROLLED_BACK`.
- **Relazione progetto/dispositivo** (indipendente dallo stato di sessione, ha senso
  solo quando la sessione è `READY`): `IN_SYNC | PROJECT_DIRTY | DEVICE_CHANGED |
  DIVERGED | INCOMPATIBLE`.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`.
- Titolo "Core Connections" (`type.display`), sottotitolo `type.caption`
  `color.ink-muted` col conteggio (es. "3 Core · 1 non in sync").
- Gruppo destro (`margin-left: auto`): pulsante primario pillola "+ Connetti un
  Core" (`radius.pill`, sfondo `color.brand.blue`, hover `color.brand.blue-dark`,
  icona Lucide `Plus`, testo `type.body-strong` bianco).

## Elenco Core (`coreBindings`)

Lista verticale di righe (non griglia — ogni riga porta troppa informazione di stato
per una card compatta), gap `space.3`, padding schermata `space.6`.

**Riga Core**: altezza minima 72px, larghezza piena, `radius.md`, `elevation.1` a
riposo/`elevation.2` in hover, sfondo `color.surface`, bordo 1px `color.border`,
padding `space.4`, `display: flex`, `align-items: center`, gap `space.4`.

- **Chip icona**: 40×40px, `radius.sm`, icona Lucide `Cpu` 20px, sfondo/colore
  secondo lo stato di sessione (vedi sotto la mappa colore).
- **Identità**: nome Core (`type.body-strong`) sopra, identificatore tecnico
  sotto (`type.mono` 12px `color.ink-faint`, es. `core://greenhouse-01`).
- **Badge stato sessione**: pillola (`radius.pill`, padding 8px/2px), pallino
  6×6px pieno + testo 12px, entrambi dello stesso colore semantico:
  - `DISCONNECTED`: sfondo `color.ink-faint` 12%, testo/pallino `color.ink-faint`.
  - `CONNECTING` / `AUTHENTICATING` / `SYNCHRONIZING`: sfondo `color.info` 12%,
    testo/pallino `color.info`, pallino pulsante (vedi `ui-behavior.md`).
  - `READY` (nessun sottostato attivo): sfondo `color.success` 12%,
    testo/pallino `color.success`.
  - `VALIDATING` / `APPLYING` / `UPDATING` / `REBOOTING` / `TRIAL`: sfondo
    `color.warning` 12%, testo/pallino `color.warning`, pallino pulsante.
  - `CONFLICT` / `ERROR` / `ROLLED_BACK`: sfondo `color.error` 12%,
    testo/pallino `color.error`.
- **Badge relazione progetto/dispositivo** (visibile solo se stato sessione =
  `READY` o uno dei suoi sottostati non transitori): pillola separata, distanziata
  dal badge sessione da `space.2`, stesso stile pillola ma icona invece del
  pallino:
  - `IN_SYNC`: icona `CircleCheck` 12px, colore `color.success`.
  - `PROJECT_DIRTY`: icona `PenLine` 12px, colore `color.warning` — "modifiche
    locali non ancora inviate".
  - `DEVICE_CHANGED`: icona `RotateCw` 12px, colore `color.info` — "il
    dispositivo ha uno stato diverso dall'ultimo deploy".
  - `DIVERGED`: icona `GitFork` 12px, colore `color.error` — "progetto e
    dispositivo sono cambiati entrambi".
  - `INCOMPATIBLE`: icona `TriangleAlert` 12px, colore `color.error` —
    "catalogo/profilo non compatibile con questo progetto".
- **Badge STALE** (Core offline, resta editabile con l'ultimo snapshot noto):
  pillola grigia (sfondo `color.ink-faint` 12%, testo `color.ink-muted`), icona
  `CloudOff` 12px, testo "stale · ultimo aggiornamento {timestamp relativo}".
  Compare al posto del badge sessione quando `DISCONNECTED` segue una sessione
  che era stata `READY` almeno una volta (distinto da un Core mai connesso, che
  mostra solo il badge `DISCONNECTED` senza "stale").
- **Azione per riga** (`margin-left: auto`): dipende dallo stato — vedi
  `ui-behavior.md` per quale azione è primaria in quale stato. Pulsante
  secondario 36px alto, `radius.sm`, bordo 1px `color.border-strong`, testo
  `type.body`.

### Isolamento errori

Una riga in `ERROR`/`CONFLICT` ha **solo il proprio bordo** in `color.error` (1px →
2px) — le altre righe della lista non cambiano aspetto. Nessun banner globale che
suggerisca "tutto è rotto" per un problema di un singolo Core.

## Stato vuoto

Nessun Core nel progetto: area sotto l'header con i glow decorativi (punto
"vetrina", coerente con `UX_ARCHITECTURE.md` § Asset decorativi), icona `Network`
48px `color.ink-faint` centrata, titolo "Nessun Core connesso" (`type.heading`),
sottotitolo `type.body` `color.ink-muted`, pulsante primario "Connetti il tuo primo
Core" centrato sotto.

## Dialogo "Connetti un Core"

`radius.lg`, `elevation.3`, larghezza 480px, overlay `rgba(20,23,31,.35)` — stesso
pattern dei dialoghi già confermato in S070/S010.

- Titolo "Connetti un Core" (`type.heading`).
- Campo "Nome" (opzionale, se vuoto si usa il nome o l'identificatore
  riportato dal dispositivo via Protocol V1).
- Selettore metodo: tre opzioni a pillola, "Auto" (selezionata di default) /
  "Core in rete" / "Core via cavo".
- "Auto" e "Core via cavo" elencano i Core trovati con Protocol V1 (più
  dispositivi, selezione multipla): porte Web Serial già autorizzate (Chrome/Edge)
  e, se in esecuzione, il ponte locale `make usb-bridge` (`ws://127.0.0.1:8766`).
  Safari non ha Web Serial: a lista vuota il dialogo spiega di chiudere
  `make monitor`, lanciare il ponte e usare «Riprova». "Core via cavo" in
  Chrome/Edge aggiunge il picker Web Serial per autorizzare una porta nuova.
  "Core in rete" rivela un campo indirizzo WebSocket (`font.mono`); l'identità
  arriva dal Core, non va digitata. I Core visti dal ponte mostrano il suffisso
  «ponte locale» sotto l'identificatore.
- Pulsante primario "Connetti" (disabilitato finché non c'è una selezione o un
  indirizzo valido), pulsante secondario "Annulla".

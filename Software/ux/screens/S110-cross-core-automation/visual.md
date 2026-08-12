# Cross-Core Automation — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Editor per collegare output/comandi di Core distinti tramite Node-RED. Usa la shell a
tre colonne standard (`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva nel
left rail: `Share2` / "Cross-Core Automation". Dipende da S111–S113.

## Perché i nodi qui non usano le categorie di S070

Il Processing Graph Editor (S070) colora i nodi per **categoria di comportamento**
(Trigger/Lettura/Elaborazione/Logica/Uscita) perché lì la domanda rilevante è "cosa
fa questo blocco". Qui invece la domanda rilevante è **"a quale Core appartiene
questo endpoint"** — un collegamento cross-Core esiste apposta per unire cose che
vivono su dispositivi fisicamente distinti, e l'utente deve riconoscere questo
subito. Per questo **il colore del nodo codifica il Core proprietario**, non il tipo
di endpoint (che è invece comunicato da icona/forma, vedi sotto) — una scelta
deliberatamente diversa da S070.

- **Palette Core**: ogni Core del progetto riceve un colore, assegnato in ordine di
  collegamento (stesso ordine di `coreBindings`), da una rotazione fissa di 6 colori
  già usati altrove nell'app (mai nuovi): `#3F77DA`, `#7C5CFC`, `#0EA5A0`,
  `#B36B00`, `#1F9D55`, `#00C4CC`. Con più di 6 Core la rotazione ricomincia — un
  caso limite accettabile, annotato ma non risolto da questo task.
- Il colore Core appare come **barra laterale 3px** del nodo (stessa posizione del
  colore-categoria in S070) e come **badge pillola** in alto sul nodo col nome del
  Core.

## Anatomia nodo — tre tipi, distinti per icona/forma, non per colore

Stessa struttura base di S070 § Anatomia del nodo (224px, `radius.md`, chip icona
24×24px, titolo/sottotitolo), con l'aggiunta del badge Core in alto:

| Tipo | Icona | Badge tipo (pillola sotto il titolo) |
|---|---|---|
| Core record field (sorgente) | `Radio` | "record" |
| Core command (destinazione) | `SendHorizontal` | "command" |
| Node-RED processing/integration | `Workflow` | "Node-RED" |

- **Core record field**: sottotitolo = schema/field (es. "temperatura ·
  °C · uint16"), sola lettura — non ha handle di ingresso.
- **Core command**: sottotitolo = comando/parametri attesi, non ha handle di
  uscita.
- **Node-RED processing**: nodo intermedio (funzione/filtro/integrazione), può
  avere sia ingresso che uscita — **nessun badge Core** (non appartiene a un
  Core specifico, il badge in alto è sostituito da "Node-RED" in
  `color.ink-faint`).
- **Indicatore stato connessione** sul nodo: pallino 6×6px accanto al badge Core,
  stessa mappa colore di `UX-S030` (verde `READY`, grigio `DISCONNECTED`,
  ambra transitorio) — un nodo il cui Core è offline resta interamente visibile
  e selezionabile, solo il pallino cambia.

## Collegamenti con trasformazione esplicita

Quando gli schemi di due endpoint collegati differiscono (es. temperatura Core A
in °C → display Core B in °F), l'edge **non converte mai implicitamente**:

- **Chip trasformazione** a metà edge: pillola piccola (`radius.pill`, sfondo
  `color.surface`, bordo 1px `color.warning`), icona `ArrowLeftRight` 12px +
  testo breve (es. "°C→°F"). Click apre un piccolo popover con la funzione di
  trasformazione scelta (select fra le trasformazioni compatibili offerte dal
  compatibility engine, mai un campo formula libera).
- Un edge fra schemi incompatibili **senza** trasformazione scelta è mostrato
  incompleto: tratteggiato `color.error`, handle di destinazione con bordo
  `color.error` pulsante (stesso stile "drop rifiutato" di S070) — non può
  essere salvato/deployato finché la trasformazione non è impostata.
- Un edge fra schemi compatibili (stessa unità/tipo) resta un edge semplice,
  nessun chip — la trasformazione compare solo quando è realmente necessaria,
  mai come passaggio obbligato ovunque.

## Link stale (dopo un catalog change)

Un edge il cui endpoint proviene da un Core il cui catalogo è cambiato: stile
tratteggiato `color.warning` (distinto dal tratteggio rosso "errore" sopra),
chip "Link non rivalidato" a metà edge, icona `RefreshCcw` 12px. Click sul chip
→ azione "Rivalida" (vedi `ui-behavior.md`/`backend-behavior.md`) — l'edge non
scompare né si "aggiusta" da solo.

## Header di schermata e tab

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`.
- Titolo "Cross-Core Automation" (`type.heading`).
- **Segmented control**, tre voci: **Grafo · Deploy Node-RED · Diagnostica**.
- Gruppo destro (solo tab Grafo): badge conteggio link stale/incompleti se
  `> 0` (`color.warning`), pulsante "Invia a Deploy" (pillola `color.brand.blue`
  — qui è legittimo restare blu: a differenza dei comandi immediati di
  `UX-S090`, un deploy Node-RED **è** una modifica persistente, coerente con la
  regola cross-cutting già stabilita lì).

## Tab Grafo (canvas)

Stesso sfondo puntinato, minimappa, controlli zoom di S070 § Canvas — colore
nodo minimappa = colore Core.

## Tab Deploy Node-RED

- **Banner di scope** (sempre visibile in cima, non solo durante un deploy):
  bordo sinistro 4px `color.info`, sfondo `color.info` 8%, icona
  `ShieldCheck` 16px, testo "Questo deploy tocca solo i nodi/flow di questo
  progetto — {N} flow Node-RED estranei restano intatti". Comunica lo scope
  **prima** che l'utente avvii qualunque azione, non solo come conferma dopo.
- **Diff** (stesso stile riga di S080 § Diff semantico: aggiunto/rimosso/
  modificato, bordo sinistro 3px colore-cambiamento): nodi/flow Node-RED che
  il deploy aggiungerebbe/rimuoverebbe/modificherebbe — ogni riga riporta
  `owner: {progetto}` per chiarire che riguarda solo i nodi posseduti.
- **Badge sync** (stessa semantica di `UX-S030`): `IN_SYNC` / `DIVERGED`
  applicata allo stato gestito Node-RED — se `DIVERGED`, stesso pattern "tre
  azioni esplicite" del pannello conflitto di `UX-S080` (qui: importa stato
  Node-RED corrente, rebase strutturato, annulla) — **mai un deploy automatico
  al reconnect**.
- Pulsante "Invia a Deploy" (stesso della tab Grafo).

## Tab Diagnostica end-to-end

Percorso a "breadcrumb" orizzontale per ciascun edge selezionato/monitorato:

```text
[Core A · record] → [Node-RED · processing] → [Core B · command]
```

- Ogni tappa: chip 200px, `radius.md`, bordo 1px colore Core (o
  `color.ink-faint` per la tappa Node-RED), icona stato connessione (stesso
  pallino di sopra), ultimo valore osservato/timestamp (`font.mono` 12px).
- **Tappa offline**: chip con opacità 60%, badge "offline" (stesso stile STALE
  di `UX-S030`) — **le altre tappe della stessa catena e le altre catene
  restano interamente leggibili e aggiornate**, un Core/Node-RED offline non
  ferma la diagnostica degli altri runtime.
- Sotto il breadcrumb: log compatto degli ultimi eventi del percorso
  (timestamp, tappa, esito — stesso stile riga log di `UX-S090`).

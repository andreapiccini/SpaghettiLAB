# Catalog & Topology Explorer — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata puramente diagnostica/informativa: esplora cosa un Core dichiara di avere
(catalogo) e come è fisicamente composto (topologia). **Nessuna modifica possibile
qui** — nessun pulsante di editing, nessun drag, nessuna azione distruttiva. Usa la
shell a tre colonne standard (`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva
nel left rail: `Boxes` / "Catalog & Topology". Nessun Inspector: il dettaglio di ogni
voce si apre in linea, non in un pannello laterale. Dipende da S041–S043.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`.
- Selettore Core (stesso pattern di S070 § Header di schermata: label "Core" +
  nome + `ChevronDown`).
- Titolo "Catalog & Topology Explorer" (`type.heading`).
- **Selettore vista**: segmented control a due voci, "Catalogo" / "Topologia"
  (`radius.pill` contenitore, bordo 1px `color.border`, sfondo `color.surface`;
  voce attiva sfondo `color.brand.blue` testo bianco, voce inattiva testo
  `color.ink-muted`), centrato.
- Gruppo destro: badge fingerprint catalogo (`type.mono` 12px `color.ink-faint`,
  es. "fp: 9c2a1f…") — permette di verificare a colpo d'occhio se due Core hanno lo
  stesso catalogo senza aprire nulla.

## Vista Catalogo

Layout ad accordion per tipo, stesso stile visivo delle categorie della Palette in
S070 (`radius.sm`, riga categoria 40px, pallino colore-tipo 8×8px, chevron -90°
chiuso), ma **non trascinabile** — click su una riga apre solo il dettaglio in linea,
niente cursore `grab`.

**Categorie, in ordine fisso**: Module Driver · Rule · Block · Opcode · Profile ·
Capability Pack. Ogni categoria mostra un badge conteggio (`type.caption`
`color.ink-faint`) accanto al nome.

**Riga voce catalogo**: altezza 44px, margine sinistro `space.4`, `radius.sm`,
padding orizzontale `space.2`, gap `space.2`.

- Chip icona 24×24px (`radius.sm`, sfondo colore-tipo 12% opacità — stessa
  convenzione `<colore>1F` di S070) — icone Lucide: `Cpu` Module Driver, `GitBranch`
  Rule, `Box` Block, `Binary` Opcode, `IdCard` Profile, `Package` Capability Pack.
- Nome (`type.body`), versione sotto (`type.caption` `font.mono` `color.ink-faint`,
  es. "v2.3.1").
- **Badge compatibilità** (`margin-left: auto`): pillola piccola, coerente con
  `color.success`/`color.warning`/`color.error` semantici:
  - "Compatibile" — sfondo `color.success` 12%, testo `color.success`.
  - "Deprecato" — sfondo `color.warning` 12%, testo `color.warning`, icona
    `TriangleAlert` 12px.
  - "Incompatibile" — sfondo `color.error` 12%, testo `color.error`, icona
    `CircleX` 12px.

**Dettaglio in linea** (espanso al click): sfondo `color.surface-raised`,
`radius.sm`, padding `space.3`, elenco campo/valore in `type.caption` +
`type.mono` (schema, unità, enum, capability/permission richieste — stessi concetti
di `EditorModel` usati per generare i form dell'Inspector in S070), sola lettura.

## Vista Topologia

Struttura gerarchica ad albero (non un diagramma spaziale — la posizione fisica reale
non è nota all'app): **Flow → Function Bay → Port → rail**, indentazione 16px per
livello, linea guida verticale 1px `color.border` a sinistra di ogni livello
figlio.

- **Riga Flow**: altezza 44px, `type.body-strong`, icona `Waypoints` 16px,
  badge "N Bay" (`type.caption` `color.ink-faint`).
- **Riga Function Bay**: altezza 40px, icona `Layers` 14px, nome dichiarato dal
  Core (mai un indice generico tipo "Bay 3" se il Core fornisce un nome).
- **Riga Port**: altezza 36px, icona `Plug` 14px, nome + badge segnale (uno dei
  cinque segnali dichiarati, es. "PWM", "ADC", "GPIO digitale", "I2C", "UART" — solo
  quelli che il Core dichiara, mai un elenco fisso ipotizzato dall'app).
- **Badge rail**: pillola piccola accanto al Port, testo = stato ammissione
  dichiarato dal Core (`ENFORCED` sfondo `color.success` 12%, `UNVERIFIED` sfondo
  `color.warning` 12%, mai normalizzati l'uno nell'altro — vedi
  `backend-behavior.md`).

**Nessun numero di pin fisso in nessun punto di questa vista** — ogni etichetta
proviene dal catalogo/topologia normalizzati, mai da una tabella hardcoded nell'app.

## Placeholder diagnostico (tipo mancante/sconosciuto)

Riga catalogo o Port con un tipo che l'app non riconosce: stesso stile riga, ma
chip icona con `TriangleAlert` 14px `color.warning` su sfondo `color.warning` 12%,
nome sostituito da `type.mono` con l'identificatore grezzo (es.
`unknown:0x4F2A`), sottotitolo "Tipo non riconosciuto" (`type.caption`
`color.warning`). Click espande il dettaglio in linea con la remediation proposta
(testo + pulsante secondario, es. "Installa Capability Pack" o "Aggiorna
firmware") — non un errore bloccante, il resto del catalogo resta interamente
navigabile.

## Stato "parziale" (lettura interrotta)

Banner sotto l'header, bordo sinistro 4px `color.warning`, sfondo
`color.warning` 8%, icona `TriangleAlert` 16px, testo "Lettura del catalogo
interrotta — {N} voci mancanti, i dati mostrati potrebbero essere incompleti" +
azione testuale "Riprova lettura". Resta visibile finché la lettura non viene
ripetuta con successo — **mai rimosso silenziosamente**, e mai presentato come se
il catalogo fosse completo.

## Stato vuoto (per davvero)

Solo quando la lettura è completa e il catalogo/topologia sono genuinamente vuoti
(nessun banner "parziale" in questo caso): icona `PackageOpen` 48px
`color.ink-faint` centrata, titolo "Nessun dato disponibile" (`type.heading`),
sottotitolo `type.body` `color.ink-muted` — non un'illustrazione "vetrina" con
glow (questa non è una schermata di benvenuto).

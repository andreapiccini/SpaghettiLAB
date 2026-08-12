# Capability Marketplace & OTA — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata per risolvere una feature firmware mancante tramite un Capability Pack e
seguire un aggiornamento firmware. Usa la shell a tre colonne standard
(`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva nel left rail: `Store` /
"Capability Marketplace". Nessun Inspector: il dettaglio vive in pannelli in linea o
in un tray laterale non modale (stesso pattern del tray candidati di S050). Dipende
da S101–S103.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`, Selettore Core (stesso stile di S070).
- **Segmented control**, tre voci: **Marketplace · Preflight · Aggiornamento**
  (stesso stile del selettore vista di `UX-S040`). "Preflight" mostra un badge
  numerico se c'è un candidato in attesa di verifica; "Aggiornamento" mostra il
  pallino di stato pulsante (`color.info`) se un OTA è in corso.

## Tab Marketplace

Sotto-selettore (segmented control secondario, stesso stile ma più piccolo, 32px
alto): **Disponibili · Installati · Richiesti dal progetto** — **tre liste
distinte, mai fuse in un'unica vista indifferenziata**, coerente con "marketplace
available catalog, Core installed feature catalog e Project required artifacts
restano distinguibili in ogni stato" (S101 punto 2).

- **Disponibili**: griglia di card pack, 240px, `radius.md`, `elevation.1`/
  `elevation.2` in hover — stesso stile delle card progetto di `UX-S010`. Nome
  pack, versione (`font.mono`), badge trust (pillola: "Verificato" `color.success`
  se firma valida da fonte trusted, "Locale" `color.ink-faint` se indice locale
  non firmato), dimensione artifact (`type.caption`), pulsante "Dettagli".
- **Installati**: stessa card ma badge di stato al posto del trust (pillola
  `color.success` "Installato"), nessun pulsante di installazione — solo
  "Dettagli" e, se non in uso, azione "Rimuovi" (bordo `color.error`, apre
  conferma distruttiva standard).
- **Richiesti dal progetto**: card con badge `color.warning` "Non ancora
  installato" o `color.error` "Non risolto" quando il resolver non trova un
  pack compatibile — ogni card qui mostra anche **da cosa** è richiesto (es.
  "richiesto da: Block Kalman nel Processing Graph") — mai un pack "richiesto"
  senza dire da dove viene la richiesta.

### Ricerca/sfoglio

Barra di ricerca pillola (stesso stile 320px di `UX-S010`), filtro per categoria
(chip multi-select: Driver, Block, Profile pack, Transport).

## Pannello dettaglio pack (tray laterale)

Click su "Dettagli" apre un tray da destra, 400px, stesso pattern non modale del
tray candidati di `UX-S050` (`elevation.2`, `border-left: 1px solid
color.border`):

- Header: nome + versione, pulsante chiudi.
- Metadata: autore, hash (`font.mono`, troncato con tooltip completo), ABI/
  Protocol/Config target, tipi forniti (elenco chip).
- **Dependency resolver**: sezione "Dipendenze" — una riga per dipendenza,
  ciascuna con icona esito e **motivazione testuale sempre presente**, mai un
  generico "non compatibile":
  - Soddisfatta: icona `Check` `color.success`, testo "già installato" o "sarà
    installato insieme".
  - Conflitto: icona `CircleAlert` `color.error`, testo esplicito (es. "in
    conflitto con Pack Modbus-Legacy già installato: entrambi dichiarano
    l'opcode 0x1A").
  - Incompatibilità: icona `CircleX` `color.error`, testo esplicito (es.
    "richiede Protocol V2, questo Core è su Protocol V1").
- Pulsante primario in fondo: "Installa" (disabilitato se una dipendenza è in
  `Conflitto`/`Incompatibilità` non risolvibile) → passa alla tab Preflight con
  questo pack come candidato.

## Tab Preflight

Attivo solo con un candidato selezionato (da Marketplace o dal resolver Device
Profile Studio di `UX-S060`). Se nessun candidato: stato vuoto, icona
`ClipboardCheck` 48px `color.ink-faint`, "Nessun candidato in verifica".

- **Checklist verifiche** (S102 punto 1), una riga 40px per voce, icona esito
  (`Check` `color.success` / `TriangleAlert` `color.warning` / `CircleX`
  `color.error`) + etichetta: Fonte trusted · Firma/hash metadata · Variante ·
  Profile · Slot/layout · Downgrade · Bootloader · Compatibilità Config/profile.
  Una voce fallita blocca il preflight — badge aggregato in cima "Bloccato: {N}
  verifiche non superate" se `> 0`.
- **Tabella budget risorse**: stesso principio "grandezze separate, mai sommate"
  di `UX-S090` § Resource monitor — righe Flash, RAM, Stack, Pool/Workspace,
  ciascuna con tre colonne `type.mono`: "Richiesto dal manifest" ·
  "Capacità build" · "Margine" (differenza, `color.success` se positivo,
  `color.error` se negativo). **Nessuna colonna "RAM libera ora"** — il
  preflight non usa mai la memoria libera istantanea come prova di
  compatibilità, per costruzione non c'è un valore del genere in questa tabella.
- Esito finale: banner in fondo, `color.success` "Pronto per l'aggiornamento" +
  pulsante "Avvia OTA", oppure `color.error` "Preflight non superato" con
  elenco sintetico delle voci bloccanti (nessun pulsante avvio).

## Tab Aggiornamento (OTA)

### Indicatore versione attiva (sempre visibile in cima alla tab)

Due pillole affiancate quando è in corso un trial, altrimenti una sola:

- "In esecuzione: v{X} (stabile)" — sfondo `color.success` 12%.
- Durante `TRIAL`: seconda pillola "In prova: v{Y} — conferma entro {countdown}"
  — sfondo `color.warning` 12%, pallino pulsante. **L'utente deve sempre poter
  distinguere a colpo d'occhio se il Core è ancora nella versione precedente o
  già in quella nuova (in prova)** — è il motivo per cui questo indicatore resta
  fisso in alto durante l'intero OTA, non solo nello stepper.

### Stepper di stato (stesso stile a tappe di `UX-S080`, non una barra unica)

```text
Arma → Carica → Avanzamento → Finalizza → Riavvia → Prova → Conferma / Rollback
```

Stessa struttura visiva dello stepper di S080 (cerchio 28px, connessi da linea
2px, stessa mappa colore attesa/in corso/riuscita/fallita) — riusato qui perché
già validato per comunicare fasi sequenziali distinte in questa app.

- Tappa "Avanzamento": barra di progresso lineare sotto il cerchio (0-100%,
  `radius.pill`, riempimento `color.info`) — questa è l'unica tappa con una
  percentuale reale (trasferimento byte), le altre restano binarie
  attesa/in corso/fatta.
- Tappa "Prova": mostra il countdown di conferma (stesso testo dell'indicatore
  in cima), pulsanti "Conferma aggiornamento" (`color.success`, pillola piena) e
  "Rollback manuale" (bordo `color.error`, testo `color.error`) affiancati.

### Stato Rollback (rassicurante, non allarmante)

Quando la tappa finale è "Rollback" (automatico dopo trial fallito/timeout, o
manuale): banner **`color.info`, non `color.error`** — deliberato: un rollback
riuscito è il sistema che ha funzionato correttamente, non un fallimento
dell'utente. Icona `ShieldCheck` 20px, titolo "Ripristinato alla versione
precedente" (`type.heading`), testo "v{X} è di nuovo attiva. Il Config e i
profili del progetto sono preservati, nessuna modifica è andata persa." — mai
un'icona di errore o un colore rosso qui.

### Audit OTA

Lista compatta sotto lo stepper, righe 32px, cronologia tentativi (timestamp,
versione target, esito) — nessun token/chiave/URL firmato mostrato (coerente con
S103 punto 4).

# Deploy & Diff — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata dove un Config viene confrontato, validato e applicato in sicurezza — la
destinazione del pulsante "Invia a Deploy" del Processing Graph Editor (S070). Usa la
shell a tre colonne standard (`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva
nel left rail: `GitCompare` / "Deploy & Diff". Nessun Inspector: il dettaglio vive
in linea nel diff stesso, non in un pannello contestuale. Dipende da S080.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`.
- Titolo "Deploy & Diff" (`type.heading`).
- Gruppo destro (`margin-left: auto`, gap `space.2`):
  - **Badge esito aggregato**: pillola col conteggio complessivo delle modifiche
    (es. "12 modifiche · 3 Core"), stesso stile dei badge conteggio già usati
    altrove.
  - **Avvia deploy**: pillola primaria, sfondo `color.brand.blue` (hover
    `color.brand.blue-dark`) — **disabilitata** (opacità 40%, `cursor:
    not-allowed`) finché almeno un Core selezionato è in stato bloccato (vedi §
    Blocco per profili/pack mancanti) o in `CONFLICT` non risolto.

## Selettore Core target (deploy multi-Core)

Riga di pillole sotto l'header, una per Core del progetto con modifiche pendenti
(`PROJECT_DIRTY`, coerente con `UX-S030`), selezionabili indipendentemente
(checkbox implicito nel click sulla pillola):

- Pillola: `radius.pill`, bordo 1px `color.border-strong`, padding 12px/6px, gap
  `space.2`. Selezionata: bordo 2px `color.brand.blue`, sfondo `color.brand.blue`
  8%. Contiene: nome Core, conteggio modifiche (`type.caption` `color.ink-faint`),
  **pallino di stato pipeline** (8×8px, colore secondo la fase corrente — stessa
  mappa colore della § Pipeline sotto), o icona `Lock` 12px se bloccato.
- Un Core senza modifiche pendenti (`IN_SYNC`) non compare in questa riga — non
  c'è nulla da mostrare per lui qui.

## Diff semantico (area principale)

Per il/i Core selezionati, diviso per tipo di entità, ciascuna sezione un
accordion (stesso stile di S040/S060): **Module · Profile · Schedule · Rule ·
Block · Edge · Policy** — sezioni senza modifiche non compaiono affatto (non
un accordion vuoto).

**Ignorato esplicitamente**: metadata di authoring (posizione canvas, colore
etichetta, commenti, gruppi) — mai mostrato come una "modifica" nel diff, coerente
con la separazione authoring/deployable già stabilita in S013/S014.

- **Riga diff**: altezza 44px, `radius.sm`, padding orizzontale `space.2`, gap
  `space.2`, bordo sinistro 3px colore secondo il tipo di cambiamento.
  - **Aggiunto**: bordo/icona `color.success` (`Plus` 14px), sfondo `color.success`
    4%.
  - **Rimosso**: bordo/icona `color.error` (`Minus` 14px), sfondo `color.error`
    4%, nome con `text-decoration: line-through` `color.ink-faint`.
  - **Modificato**: bordo/icona `color.warning` (`PenLine` 14px), sfondo
    `color.warning` 4%.
  - Nome entità (`type.body`), sottotitolo id/percorso (`type.mono` 11px
    `color.ink-faint`).
  - `margin-left: auto`: per "Modificato", link testuale "Vedi campi" che espande
    il dettaglio in linea (stesso pattern di S040 § Dettaglio in linea): elenco
    campo `type.caption` con valore precedente (barrato, `color.ink-faint`) →
    valore nuovo (`color.ink`).
- Sezione con badge conteggio nel titolo (es. "Module (2 aggiunti, 1
  modificato)").

## Pipeline — sequenza di stati (non una barra unica)

Stepper orizzontale sotto il diff (o per Core selezionato, se più di uno è
attivo), 6 tappe fisse in ordine, ciascuna con il proprio stato — **mai una
singola barra di progresso indifferenziata**:

```text
Compila → Valida locale → Risolvi artifact → Valida remota → Applica (CAS) → Verifica read-back
```

- **Tappa**: cerchio 28px + etichetta sotto (`type.caption`), connessi da una
  linea 2px.
  - In attesa: cerchio bordo 1px `color.border`, sfondo `color.surface`, testo
    `color.ink-faint`.
  - In corso: cerchio bordo 2px `color.info`, sfondo `color.info` 12%, pallino
    interno pulsante (vedi `ui-behavior.md`).
  - Riuscita: cerchio pieno `color.success`, icona `Check` 14px bianca.
  - Fallita: cerchio pieno `color.error`, icona `X` 14px bianca — le tappe
    successive restano "in attesa" (mai marcate fallite per propagazione), la
    linea di connessione dopo il fallimento è tratteggiata `color.border`.
- Sotto lo stepper, riga di dettaglio testuale della tappa corrente/fallita
  (`type.body` `color.ink-muted`, es. "Validazione remota: risorsa insufficiente
  su Bay `sensori-esterni`" — mai un generico "errore").

## Gestione conflitto (`CONFLICT`)

Quando la tappa "Applica (CAS)" fallisce per generation/hash non corrispondenti:
pannello dedicato (non un semplice stato della pipeline) che sostituisce l'area
diff per quel Core, bordo `color.error`, `radius.md`, padding `space.4`:

- Titolo "Conflitto su {nome Core}" (`type.heading`), testo esplicativo: il
  dispositivo ha uno snapshot diverso da quello atteso al momento dell'apply.
- **Tre azioni esplicite, stesso peso visivo** (mai un pulsante preselezionato
  "consigliato" che spinga verso l'opzione distruttiva):
  1. "Importa stato live" — bordo `color.border-strong`.
  2. "Rebase/merge strutturato" — bordo `color.border-strong`.
  3. "Annulla" — bordo `color.border-strong`, testo `color.ink-muted`.
- **Nessun pulsante "sovrascrivi e basta"** in nessuna forma — principio
  esplicito del task, non solo una scelta di default.

## Blocco per profili/pack mancanti

Banner sopra il diff, bordo sinistro 4px `color.warning`, sfondo `color.warning`
8%, icona `PackageX` 16px: "Deploy bloccato: {N} profili/pack richiesti non sono
installati" + elenco compatto delle voci mancanti, ciascuna con link diretto
("Vai a Device Profile Studio" o "Vai a Capability Marketplace", colore
`color.brand.blue`, sottolineato). Il pulsante "Avvia deploy" resta disabilitato
finché il banner è presente.

## Report multi-Core (dopo l'esecuzione)

Riepilogo per-target, una riga per Core coinvolto, indipendente dagli altri:

- Riga: 56px, `radius.md`, bordo 1px `color.border`, icona esito grande (`Check`
  `color.success` / `X` `color.error` / `Clock` `color.ink-faint` se ancora in
  corso), nome Core, riepilogo testuale ("Deploy riuscito" / "Fallito: {motivo
  sintetico}" / "In corso — {tappa corrente}").
- **Un fallimento su un Core non altera visivamente le righe degli altri Core** —
  ognuna riflette solo il proprio esito, coerente con l'isolamento errori già
  stabilito in `UX-S030`.

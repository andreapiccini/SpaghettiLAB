# Device Profile Studio — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Editor con cui si descrive un nuovo sensore/attuatore compatibile con gli opcode già
installati, senza aggiornamento firmware. Usa la shell a tre colonne standard
(`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva nel left rail: `Cpu` /
"Device Profile Studio". Dipende da S061–S063.

## Perché questa schermata NON usa il canvas React Flow

Il Processing Graph Editor (S070) rappresenta un grafo di comportamento dove più
percorsi possono coesistere ed essere collegati in parallelo — un canvas comunica
bene quella semantica. Un profilo dispositivo invece descrive **una procedura
sequenziale rigida**: la sonda di identità, l'init, il campionamento sono liste
ordinate di step che il Core esegue in ordine esatto, senza diramazioni parallele.
Un grafo qui implicherebbe una semantica di branching/concorrenza che non esiste,
ed è più difficile leggere "questo succede prima di quello" in un layout spaziale
libero che in una lista verticale ordinata con drag-to-reorder. Per questo l'editor
è **una sequenza di step**, non nodi ed edge.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`.
- Campo nome profilo inline (`type.heading`, editabile al click, stesso
  comportamento "click per rinominare" già noto da altre schermate).
- Gruppo destro (`margin-left: auto`, gap `space.2`):
  - **Badge esito resolver** (compatto, riflette la stessa card mostrata nel
    pannello a destra — vedi sotto): pillola, icona + testo secondo l'esito,
    colori come nella tabella "Esiti del resolver".
  - **Importa** / **Esporta**: pulsanti secondari 36px, bordo 1px
    `color.border-strong`, icone `Upload`/`Download` 16px.
  - **Salva profilo**: pillola primaria, sfondo `color.brand.blue`, hover
    `color.brand.blue-dark`.

## Layout: contenuto + pannello compatibilità

Due colonne: area di editing a sinistra (flessibile), pannello "Compatibilità"
fisso a destra, **320px, stesso stile dell'Inspector** di S070 (`border-left: 1px
solid color.border`, sfondo bianco) ma sempre visibile, non contestuale a una
selezione.

### Area di editing — tab

Segmented control orizzontale sotto l'header (stesso stile del selettore vista di
`UX-S040`): **Metadata · Transport & Elettrico · Istruzioni · Output**.

#### Tab Metadata

Form semplice, stesso stile campo testo di S070 § Inspector: Nome, ID (sola
lettura dopo la prima creazione, `font.mono`), Versione (`font.mono`, es.
"1.2.0"), Autore, Descrizione (textarea).

#### Tab Transport & Elettrico

- Selettore transport (I2C/SPI/UART), select stile pillola.
- **Banner vincolo elettrico** (sola lettura, non un campo compilabile): bordo
  sinistro 4px `color.info`, sfondo `color.info` 8%, icona `Plug` 16px, testo
  "Vincoli da Bay `{nome Bay}`: {tensione}, {modalità}, {frequenza max}" — il
  vincolo **deriva dalla Bay scelta in Physical Composition (S050), mai dal
  testo del profilo**: se il profilo dichiara un requisito che eccede questo
  banner, il campo relativo (es. frequenza bus) mostra bordo `color.error` con
  messaggio "Eccede il limite della Bay selezionata" — stesso principio "errore
  isolato di campo" già usato in S050/S070, ma il vincolo di confronto viene da
  fuori al form, non da una regola statica del profilo.
- Se nessuna Bay è ancora associata: banner sostituito da uno stile
  `color.warning`, testo "Nessuna Bay associata — collega questo profilo a un
  Module in Physical Composition per vedere i vincoli elettrici reali", azione
  "Vai a Physical Composition".

#### Tab Istruzioni

Sei sezioni fisse, in ordine, ciascuna un accordion (stesso stile accordion di
S040/S070): **Identity probe · Init · Sample · Event · Command · Safe-stop**.
Una sezione senza step è collassata di default con badge conteggio "0 step" e
testo `color.ink-faint`.

- **Riga step**: altezza 40px, `radius.sm`, sfondo `color.surface`, bordo 1px
  `color.border`, padding orizzontale `space.2`, gap `space.2`, margine
  inferiore `space.1` fra step consecutivi.
  - Maniglia drag a sinistra (icona `GripVertical` 14px `color.ink-faint`,
    cursore `grab`).
  - Numero d'ordine (`type.mono` 11px `color.ink-faint`, es. "03").
  - Chip icona 20×20px per tipo di step (vedi tabella sotto), sfondo
    colore-tipo 12% opacità.
  - Riepilogo step in linea (`type.body` 13px, es. "Leggi 2 byte da reg 0x2A
    (I2C)") — non richiede aprire un dettaglio per capire cosa fa lo step.
  - `margin-left: auto`: icona modifica (`Pencil` 14px) ed elimina (`Trash2`
    14px `color.error` on hover), entrambe 28×28px.
  - Step con opcode non installato: bordo `color.warning`, badge inline "Opcode
    non installato" (pillola piccola `color.warning` 12%) prima del riepilogo —
    vedi § Stato opcode assente.
- **Riga "+ Aggiungi step"**: stesso stile di S050 § Lista Module, testo
  `color.brand.blue`, apre un selettore di tipo step (menu a tendina):
  Transazione I2C · Transazione SPI · Transazione UART · GPIO · ADC · Wait
  (bounded) · Byte operation · Mask/Shift/Sign · CRC · Emit.
- **Dettaglio step** (espanso al click su modifica): form specifico per tipo,
  stesso stile campo di S070 § Inspector (es. per una transazione I2C: indirizzo
  registro `font.mono`, numero byte, direzione lettura/scrittura; per Wait:
  durata + timeout massimo consentito, mai illimitato — coerente con "wait
  bounded" di S061).

#### Tab Output

Lista campi output, stesso stile riga di S040 § Catalogo: nome campo, tipo
(`font.mono`, es. "uint16 fixed-point Q8.8"), unità, badge "richiesto"/opzionale.
Riga "+ Aggiungi campo output".

### Pannello "Compatibilità" (destra, 320px)

Header: "Compatibilità con {Core selezionato}" (`type.heading`), selettore Core
sotto (stesso stile del Selettore Core di S070, se il progetto ha più Core).

**Una delle sei card esito**, sempre una sola visibile (mai più di un esito alla
volta — sono mutuamente esclusivi), stesso schema per tutte: icona 32px in chip
`radius.sm` colore-esito 12% opacità, titolo (`type.heading`), descrizione
(`type.body` `color.ink-muted`), pulsante azione primario coerente con l'esito.

| Esito | Colore | Icona | Titolo | Azione |
|---|---|---|---|---|
| `READY` | `color.success` | `CircleCheck` | "Pronto" | "Instanzia come Module" (→ Physical Composition) |
| `PROFILE_INSTALL_REQUIRED` | `color.info` | `DownloadCloud` | "Serve installare il profilo" | "Installa profilo" |
| `FIRMWARE_UPDATE_REQUIRED` | `color.warning` | `TriangleAlert` | "Manca supporto firmware" | "Vedi requisiti firmware" |
| `HARDWARE_INCOMPATIBLE` | `color.error` | `CircleX` | "Bay non compatibile" | "Cambia Bay" (→ Physical Composition) |
| `RESOURCE_INCOMPATIBLE` | `color.error` | `Gauge` | "Budget locale superato" | "Vedi dettaglio budget" |
| `VERSION_CONFLICT` | `color.error` | `GitCompareArrows` | "Versione non corrispondente" | "Aggiorna pacchetto" |

**Dettaglio budget** (espanso da "Vedi dettaglio budget"): tabella compatta
`type.mono` 12px, righe "Operation count", "Byte", "Timeout", "Temporanei",
"Output" — ciascuna con valore calcolato vs limite Core, riga in `color.error`
se supera il limite.

## Stato opcode assente

Uno step che referenzia un opcode non installato (badge inline in § Tab
Istruzioni) **non tenta mai un'installazione dati in autonomo** — l'unica azione
disponibile è "Proponi Capability Pack", che porta l'utente verso la stessa
superficie di installazione già mostrata nel pannello Compatibilità per l'esito
`FIRMWARE_UPDATE_REQUIRED`/`PROFILE_INSTALL_REQUIRED`. Non esiste un pulsante
"installa" diretto sullo step.

## Dialogo import/export

`radius.lg`, `elevation.3`, stesso pattern dei dialoghi già confermato in
S010/S030 — **mai un'importazione silenziosa** (stessa regola di `UX-S120`):

- **Importa**: mostra anteprima del pacchetto prima di confermare — ID,
  versione, hash (`font.mono`), autore, dipendenze opcode dichiarate, elenco
  campi/step (sola lettura, scrollabile). Pulsante "Importa" solo dopo
  l'anteprima, mai al solo drop del file.
- **Esporta**: mostra lo stesso riepilogo (ID/versione/hash del pacchetto che
  verrà generato) prima di confermare il download.

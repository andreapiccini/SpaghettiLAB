# Runtime & Diagnostics — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Schermata per osservare un Core **live**: telemetria, comandi immediati, discovery,
salute e risorse. Usa la shell a tre colonne standard (`UX_ARCHITECTURE.md` § Shell
applicativa) — voce attiva nel left rail: `Activity` / "Runtime & Diagnostics".
Nessun Inspector: ogni dettaglio vive in linea. Dipende da S091–S094.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`, Selettore Core (stesso stile di S070).
- **Segmented control**, cinque voci: **Telemetria · Comandi · Discovery · Stato &
  Risorse · Amministrazione** (stesso stile del selettore vista di `UX-S040`).

## Distinzione cross-cutting: comando immediato ≠ modifica Config

**Regola visiva unica per tutta la schermata**, non ripetuta per tab: qualunque
azione che esegue un comando immediato sul Core (Command runner, Discovery,
Amministrazione) usa `color.brand.purple-glow` (`#7D2AE8`, già token di
`UX_ARCHITECTURE.md` § Asset decorativi, qui riusato come accento "azione live")
per pulsanti primari e badge di esito — **mai** `color.brand.blue`, riservato
esclusivamente ad azioni che toccano il Config persistente (es. "Invia a Deploy" di
S080). Un pulsante viola in questa schermata comunica sempre "succede ora sul
dispositivo, non tocca il tuo progetto".

## Tab Telemetria

- Barra strumenti: filtro per Module/schema (select pillola), toggle "Live" (pausa
  auto-scroll, icona `Pause`/`Play`), badge conteggio record ricevuti/scartati.
- **Stream record**, lista verticale densa, righe 32px:
  - Timestamp (`font.mono` 12px `color.ink-faint`, uptime + clock se disponibile).
  - Chip Module/schema sorgente (`type.caption`).
  - Valore decodificato (`type.body` `font.mono` per numerici).
  - **Chip boot ID** (`type.mono` 10px, sfondo `color.surface-raised`, es. "boot
    #4") e **chip sequence** (es. "#1042") sempre visibili, non solo al passaggio
    del mouse.
- **Riga di gap** (interruzione fra due record): riga distinta a tutta larghezza,
  sfondo `color.warning` 8%, bordo tratteggiato 1px `color.warning` sopra/sotto,
  icona `Unlink` 14px, testo "{N} record mancanti — boot ID cambiato da #3 a #4" o
  "sequence non contigua (atteso #1041, ricevuto #1050)" — **mai una linea
  temporale continua che nasconde la discontinuità**.
- **Riga schema sconosciuto**: stesso stile del placeholder diagnostico di
  `UX-S040` (chip `TriangleAlert` `color.warning`), payload grezzo mostrato
  `font.mono`, testo "Schema non riconosciuto — aggiorna il catalogo" con azione.
- Stato vuoto: icona `Radio` 48px `color.ink-faint`, "Nessuna telemetria ricevuta".

## Tab Comandi (Command runner)

- **Catalogo comandi**, lista ad accordion per categoria (stesso stile Palette di
  S070/Catalogo di S040), riga comando 44px: chip icona `Terminal` 20px sfondo
  `color.brand.purple-glow` 12%, nome comando, sottotitolo target
  (Module/Bay/servizio).
- Click su un comando apre il **form tipizzato** in linea sotto la riga (stesso
  stile campo di S070 § Inspector, generato da schema — coerente con
  "form/proprietà schema-driven" già usato ovunque in questa app), pulsante
  **"Esegui"**: pillola **bordo 2px `color.brand.purple-glow`, sfondo
  trasparente**, testo `color.brand.purple-glow` — deliberatamente non uno sfondo
  pieno come "Invia a Deploy", per restare visivamente secondario a qualunque
  azione Config nella stessa vista mentale dell'utente.
- **Esito comando**: badge inline dopo l'esecuzione, distinto per caso (mai
  genericamente "errore"):
  - Riuscito: `color.success`, icona `Check`.
  - `PERMISSION_DENIED`: `color.error`, icona `Lock`, testo esplicito "Permesso
    negato".
  - `QUEUE_FULL`: `color.warning`, icona `Clock`, testo "Coda comandi piena —
    riprova".
  - `JOB_TIMEOUT`: `color.warning`, icona `TimerOff`, testo "Timeout in attesa
    del risultato".
- **Log comandi eseguiti** (sotto il catalogo): righe compatte 28px, timestamp +
  nome comando + esito (stessi badge), sempre nello stesso accento viola per
  distinguerlo visivamente da un log di deploy.

## Tab Discovery

- Pulsante "Avvia scansione" (bordo `color.brand.purple-glow`, stesso stile
  outline dei comandi).
- **Avviso policy invasiva** (dialogo, prima di avviare una scansione marcata
  invasiva dal catalogo): `radius.lg`, `elevation.3`, icona `TriangleAlert` 24px
  `color.warning`, testo esplicito su cosa comporta la scansione (es. "questa
  scansione interrompe temporaneamente il traffico Bus X"), pulsanti "Annulla" /
  "Avvia comunque" (quest'ultimo **non** in `color.error` — non è un'azione
  distruttiva sui dati, è invasiva sul traffico, resta nell'accento viola).
- **Lista candidati**: stesso stile card di S050 § Tray candidati (confidenza,
  authority, preview), qui inline nella tab invece che in un tray laterale
  (questa è già una vista dedicata). Accetta/Rifiuta stesso peso visivo, "Accetta"
  porta a Physical Composition (S050) con il candidato precompilato — **nessun
  apply automatico**.
- Progresso job di scansione: stepper minimale (non lo stepper a 6 tappe di
  S080 — qui basta "In corso… / Completato / Annullato", `type.body`
  `color.ink-muted` + pallino pulsante durante l'esecuzione).

## Tab Stato & Risorse

### Striscia di stato (in alto)

Riga di chip compatti, uno per categoria di stato (Module, Schedule, Rule, Block,
Servizio, Connectivity, Health, Reset cause, Watchdog, Audit, Job): pillola
`radius.pill`, pallino 6×6px + testo, colore secondo lo stato aggregato di quella
categoria (`color.success`/`color.warning`/`color.error`/`color.ink-faint` se
n/d). Click espande il dettaglio di quella categoria sotto, in linea.

### Resource monitor

**Ogni grandezza è una card separata, mai sommata in un unico numero** — griglia
di card 260px, `radius.md`, `elevation.1`, sfondo `color.surface`, bordo 1px
`color.border`, padding `space.4`:

- **Flash/image headroom**: titolo (`type.body-strong`), barra orizzontale 8px
  `radius.pill` (sfondo `color.surface-raised`, riempimento `color.brand.blue`
  proporzionale a usato/totale — qui è un dato Config-correlato, non
  un'azione, quindi resta nell'accento blu standard, non viola), testo sotto
  `type.caption` `font.mono` (es. "212 KB / 512 KB").
- **RAM statica**: stessa struttura card, barra separata — **card distinta dalla
  Flash**, mai un'unica barra "memoria".
- **Pool/workspace/stack**: una card per pool, tre valori mostrati esplicitamente
  affiancati (`type.mono` 12px, non solo la barra): "capacity {X} · current {Y} ·
  peak {Z}" — il peak resta visibile anche se `current` è tornato basso (nessun
  reset implicito al render).
- **Allocation failures**: card dedicata, contatore grande (`type.display` se
  `>0`, colore `color.error`; se `0`, `color.ink-faint` normale), sottotitolo
  "Ultima occorrenza: {timestamp}" — visibile anche dopo che la condizione è
  rientrata, mai nascosta quando torna a zero.

## Tab Amministrazione

Lista di operazioni raggruppate per area — **Connectivity policy · Lease ·
Maintenance · Credential/Provisioning · Reset scope** — ciascuna sezione un
gruppo di righe 44px (stesso stile riga azione di S010 § Inspector: nome
operazione, sottotitolo target, pulsante a destra).

- Operazione non distruttiva: pulsante outline viola standard (coerente con la
  regola cross-cutting sopra).
- **Operazione distruttiva/irreversibile**: pulsante testo `color.error`, bordo
  `color.error` — al click apre il dialogo di conferma standard di
  `UX_ARCHITECTURE.md` § Convenzioni cross-cutting: `elevation.3`, titolo che
  nomina il target esplicito (mai "sei sicuro?"), pulsante conferma
  `color.error`, richiede di scrivere il nome del target per azioni con impatto
  multi-Core (es. reset scope che tocca più Bay).
- **Permesso mancante**: pulsante disabilitato (opacità 40%) con tooltip al
  hover che spiega quale permesso manca — mai nascosto, sempre visibile ma non
  azionabile.

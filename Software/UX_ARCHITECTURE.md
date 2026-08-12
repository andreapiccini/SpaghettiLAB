# Architettura UI/UX SpaghettiLAB React Flow V1

[Architettura funzionale](REACT_FLOW_ARCHITECTURE.md) ·
[Roadmap backend](roadmap/react-flow-v1/README.md) ·
[Roadmap UX](roadmap/ux-v1/README.md) ·
[Schermate](ux/screens/)

## Scopo

`REACT_FLOW_ARCHITECTURE.md` congela funzioni, dati e protocolli e dichiara
esplicitamente di non imporre design grafico. Questo documento è il livello che manca:
traduce quell'architettura in schermate, componenti e comportamento visivo concreti,
abbastanza specifici da poter essere riprodotti in Figma, in un tool "code + design"
o in Lovable **senza dover inventare dettagli mancanti**.

Non è un mockup. È la specifica da cui un mockup si genera — colori, spaziature,
struttura di navigazione e comportamento di ogni schermata sono definiti qui in modo
non ambiguo. La resa grafica finale (font esatto renderizzato, micro-dettagli
d'animazione) può ancora essere rifinita in Figma, ma la struttura, i token e il
comportamento no: quelli sono la fonte di verità.

## Perché tre layer per ogni feature

Ogni schermata/feature è specificata in tre documenti separati, non uno:

1. **Visual** (`visual.md`) — come appare: layout, componenti, token usati, stati
   visivi (vuoto, caricamento, errore, popolato).
2. **UI behavior** (`ui-behavior.md`) — cosa succede nell'interfaccia prima e
   indipendentemente da qualunque chiamata al backend: hover, click, animazioni,
   validazione locale, feedback ottimistico, stato di un interruttore.
3. **Backend behavior** (`backend-behavior.md`) — quale comando di dominio o
   operazione SDK parte davvero, cosa arriva indietro, come lo stato
   loading/success/error/conflict si riflette nella UI.

La separazione non è burocrazia: serve a poter cambiare un interruttore, un'animazione
o un colore (layer 1-2) **senza toccare** il file che descrive quale funzione di
dominio/SDK viene invocata (layer 3), e viceversa — un cambio di endpoint o di
gestione errori non deve costringere a ritoccare tre file per un singolo bottone.
Ogni feature ha la sua cartella sotto `ux/screens/`, quindi modificare una feature non
tocca le altre.

## Struttura dei file

```text
Software/
  UX_ARCHITECTURE.md          questo file — shell, navigazione, design token, convenzioni
  ux/
    screens/
      S030-core-connections/
        visual.md
        ui-behavior.md
        backend-behavior.md
      S050-physical-composition/
        visual.md
        ui-behavior.md
        backend-behavior.md
      ... una cartella per schermata, nominata come la fase S0NN che la produce
```

Il nome della cartella usa il prefisso della fase `roadmap/react-flow-v1` da cui la
schermata dipende principalmente — così è immediato sapere quale task backend abilita
quale schermata, nelle due direzioni.

## Shell applicativa

Layout fisso su tutte le schermate, tre regioni:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Top bar (56px)                                                   │
│  [Logo]  [Core attivo: nome · stato sessione]      [Deploy] [⋮]  │
├───────────┬───────────────────────────────────────┬─────────────┤
│           │                                        │             │
│ Left rail │           Area di contenuto            │  Inspector  │
│ (64px     │           principale                   │  contestuale│
│  collassa-│                                        │  (320px,    │
│  ta) /    │                                        │  opzionale, │
│  240px    │                                        │  si apre su │
│  espansa  │                                        │  selezione) │
│           │                                        │             │
└───────────┴───────────────────────────────────────┴─────────────┘
```

- **Top bar**: logo/nome workspace a sinistra; al centro il Core attualmente attivo con
  indicatore di stato sessione (vedi Stati di sessione più sotto); a destra il pulsante
  Deploy (con badge conteggio modifiche pendenti, stile Node-RED già noto all'utente) e
  un menu overflow per azioni globali (Import/Export progetto, Impostazioni).
- **Left rail**: un'icona per ciascuna delle 11 schermate (elenco sotto), raggruppate in
  tre sezioni separate da un separatore sottile: *Composizione* (Core connections,
  Catalog/Topology, Physical Composition, Device Profiles), *Comportamento*
  (Processing Graph, Deploy & Diff, Runtime & Diagnostics), *Estensioni* (Capability
  Marketplace, Cross-Core Automation, Settings). Espandibile con testo etichetta o
  collassata a sole icone (preferenza utente persistita).
- **Inspector**: pannello contestuale che appare quando qualcosa è selezionato nell'area
  principale (un nodo, un Module, un Core). Non è sempre visibile — il layout senza
  Inspector aperto usa la larghezza extra per l'area di contenuto.

## Elenco schermate (mappate alle fasi backend)

| Schermata | Cartella `ux/screens/` | Fase/i backend | Task | Stato documento |
|---|---|---|---|---|
| Project/Workspace Shell | `S010-workspace-shell` | S011–S014 | [UX-S010](roadmap/ux-v1/tasks/UX-S010-workspace-shell.md) | ✅ |
| Core Connections | `S030-core-connections` | S030 | [UX-S030](roadmap/ux-v1/tasks/UX-S030-core-connections.md) | ⬜ da scrivere |
| Catalog & Topology Explorer | `S040-catalog-topology` | S041–S043 | [UX-S040](roadmap/ux-v1/tasks/UX-S040-catalog-topology.md) | ⬜ da scrivere |
| Physical Composition Editor | `S050-physical-composition` | S050 | [UX-S050](roadmap/ux-v1/tasks/UX-S050-physical-composition.md) | ⬜ da scrivere |
| Device Profile Studio | `S060-device-profile-studio` | S061–S063 | [UX-S060](roadmap/ux-v1/tasks/UX-S060-device-profile-studio.md) | ⬜ da scrivere |
| Processing Graph Editor | `S070-processing-graph-editor` | S071–S073 | — | ✅ as-built confermata (prototipo React validato) |
| Deploy & Diff | `S080-deploy-diff` | S080 | [UX-S080](roadmap/ux-v1/tasks/UX-S080-deploy-diff.md) | ⬜ da scrivere |
| Runtime & Diagnostics | `S090-runtime-diagnostics` | S091–S094 | [UX-S090](roadmap/ux-v1/tasks/UX-S090-runtime-diagnostics.md) | ⬜ da scrivere |
| Capability Marketplace & OTA | `S100-capability-marketplace` | S101–S103 | [UX-S100](roadmap/ux-v1/tasks/UX-S100-capability-marketplace.md) | ⬜ da scrivere |
| Cross-Core Automation | `S110-cross-core-automation` | S111–S113 | [UX-S110](roadmap/ux-v1/tasks/UX-S110-cross-core-automation.md) | ⬜ da scrivere |
| Settings, Security & Recovery | `S120-settings-security` | S121–S124 | [UX-S120](roadmap/ux-v1/tasks/UX-S120-settings-security.md) | ⬜ da scrivere |

Il lavoro su ciascuna schermata è tracciato in [`roadmap/ux-v1/`](roadmap/ux-v1/README.md)
— task indipendenti dalla roadmap backend, possono procedere in parallelo.

**Solo `S070-processing-graph-editor` è scritta per intero, come esempio da validare
prima di generare le altre dieci.**

## Design token

Ricampionati direttamente da [spaghetti-lab.my.canva.site](https://spaghetti-lab.my.canva.site)
(CSS/SVG computati, non stime a occhio) il 2026-08-12. Questo è ora l'origine di
verità del brand; il tema Node-RED (`Software/node-red/theme/`) è stato allineato a
questi valori (era `#2954EB`, ora `#3F77DA`).

### Colore

| Token | Valore | Uso |
|---|---|---|
| `color.brand.blue` | `#3F77DA` | Accento primario, azioni principali, elementi attivi/selezionati — colore esatto del bottone "Join Early Access" sul sito |
| `color.brand.blue-dark` | `#2E5FBD` | Hover/active dell'accento primario (blue scurito ~15%) |
| `color.brand.cyan-glow` | `#00C4CC` | Glow decorativo (radiale, sfuma a trasparente) — vedi "Asset decorativi" |
| `color.brand.purple-glow` | `#7D2AE8` | Glow decorativo (radiale, sfuma a trasparente) — vedi "Asset decorativi" |
| `color.ink` | `#14171F` | Testo primario |
| `color.ink-muted` | `#4B4F58` | Testo secondario |
| `color.ink-faint` | `#8A8F99` | Testo terziario, placeholder |
| `color.surface` | `#FFFFFF` | Sfondo card/pannelli |
| `color.surface-sunken` | `#F5F6F7` | Sfondo canvas/aree ribassate — stesso grigio chiaro dello sfondo pagina del sito |
| `color.surface-raised` | `#F8F9FC` | Sfondo hover su superfici chiare |
| `color.border` | `#E1E4EB` | Bordi standard |
| `color.border-strong` | `#D7DBE3` | Bordi di elementi interattivi (input) |
| `color.success` | `#1F9D55` | Stato riuscito, IN_SYNC |
| `color.warning` | `#B36B00` | Stato da verificare, PROJECT_DIRTY |
| `color.error` | `#D6373D` | Errore, DIVERGED, INCOMPATIBLE |
| `color.info` | `#3F77DA` | Informativo (riusa brand blue) |

Le entità di dominio hanno colori semantici propri, non estetici — vedi
`ui-behavior.md` di ogni schermata per la mappatura specifica (es. stato sessione Core,
severità errore, categoria nodo nel Processing Graph).

### Tipografia

Il sito usa **"Canva Sans"** per i titoli e **"Noto Sans"** per il corpo testo. Canva
Sans è un font proprietario di Canva, non disponibile per l'uso fuori da Canva — non
può essere embeddato in un'app React. Noto Sans invece è open source (Google Fonts) ed
è riusabile direttamente.

| Token | Font | Note |
|---|---|---|
| `font.heading` | **Manrope** (Google Fonts, SIL Open Font License) | Sostituto libero più vicino a Canva Sans: stessa famiglia geometrica/umanista, stesso peso "bold amichevole" visibile in "SNAP. STACK. BUILD." |
| `font.body` | **Noto Sans** (Google Fonts) | Identico al sito, nessun compromesso — usarlo per davvero, non un sostituto |
| `font.mono` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` | Non presente sul sito (è solo landing page), scelta nostra per ID/hash/valori tecnici |

Fallback stack completo: `font.heading` = `"Manrope", -apple-system, BlinkMacSystemFont,
sans-serif`; `font.body` = `"Noto Sans", -apple-system, BlinkMacSystemFont, sans-serif`.

| Token | Font / Size / Weight / Line-height | Uso |
|---|---|---|
| `type.display` | `font.heading` / 28px / 700 / 1.2 | Titolo schermata |
| `type.heading` | `font.heading` / 18px / 600 / 1.3 | Titolo sezione/card |
| `type.body` | `font.body` / 14px / 400 / 1.5 | Testo standard |
| `type.body-strong` | `font.body` / 14px / 600 / 1.5 | Enfasi in linea, label di campo |
| `type.caption` | `font.body` / 12px / 400 / 1.4 | Metadati, timestamp, hint |
| `type.mono` | `font.mono` / 13px / 400 / 1.5 | ID, hash, valori tecnici |

### Asset decorativi

Il sito usa due "glow" radiali morbidi come decorazione di sfondo dietro l'hero
(ciano `#00C4CC` e viola `#7D2AE8`, gradiente radiale che sfuma a opacità 0, versione
piena all'85-100% e una versione più ampia/diffusa più tenue). È un tratto
identificativo del brand, non solo della landing page — usarlo con moderazione in
punti "vetrina" dell'app (schermata di benvenuto/onboarding, stato vuoto del primo
progetto), mai come sfondo di schermate di lavoro dense di dati.

```css
/* riferimento CSS diretto, valori dai gradient SVG del sito */
background:
  radial-gradient(circle at 20% 20%, rgba(0,196,204,0.35), transparent 40%),
  radial-gradient(circle at 80% 30%, rgba(125,42,232,0.30), transparent 45%);
```

Logo: usare l'asset già presente in repo (`spaghetti-logo-blu.png`, confermato
identico a quello del sito) e la sua versione ritagliata solo icona già prodotta per
il tema Node-RED (`Software/node-red/theme/safe/header-icon.png`) per i contesti dove
serve il solo simbolo (favicon, icona app, avatar workspace).

### Spaziatura

Scala a incrementi di 4px: `space.1 = 4px`, `space.2 = 8px`, `space.3 = 12px`,
`space.4 = 16px`, `space.6 = 24px`, `space.8 = 32px`, `space.12 = 48px`,
`space.16 = 64px`. Ogni valore di padding/margin/gap nelle schermate deve usare uno di
questi, mai un numero arbitrario.

### Raggi ed elevazione

| Token | Valore |
|---|---|
| `radius.sm` | 8px — input, chip, righe di lista |
| `radius.md` | 12px — card, pannelli |
| `radius.lg` | 16px — dialoghi, modali |
| `radius.pill` | 999px — pulsanti, badge di stato |
| `elevation.1` | `0 1px 2px rgba(20,23,31,.06), 0 2px 8px rgba(20,23,31,.06)` — card a riposo |
| `elevation.2` | `0 4px 16px rgba(20,23,31,.10), 0 2px 6px rgba(20,23,31,.08)` — hover/dropdown |
| `elevation.3` | `0 16px 48px rgba(20,23,31,.22), 0 4px 16px rgba(20,23,31,.12)` — dialoghi modali |

**Convenzione confermata — nomi CSS reali**: nell'implementazione validata (vedi
sotto) questi token sono variabili CSS `--radius-slsm` / `--radius-slmd` /
`--radius-sllg` (stessi valori 8/12/16px) e `--shadow-e1` / `--shadow-e2` /
`--shadow-e3`. Usare questi nomi nel codice per coerenza con quanto già verificato.

**Convenzione confermata — colore su chip**: ogni chip icona (palette, nodo,
Inspector) usa il colore semantico/categoria con sfondo al **12% di opacità**,
ottenuto appendendo il suffisso esadecimale `1F` al colore a 6 cifre (es. `#3F77DA1F`).
Regola generale, non solo per il Processing Graph Editor.

### Icone

Set unico coerente in tutta l'app — usare [Lucide](https://lucide.dev/) (MIT, stroke
1.5-2px, stessa famiglia visiva già comune in tool developer moderni). Ogni schermata
elenca le icone specifiche richieste nel proprio `visual.md`.

### Logo nella top bar — risolto

**Decisione chiusa il 2026-08-12**: si usa il logo reale, non il badge a gradiente con
"S" generato dal prototipo (quello resta scartato).

Asset canonici (nuovi, con canale alpha reale — verificato, non solo dichiarato):

| File | Origine | Uso |
|---|---|---|
| `ux/assets/logo-full.png` (1067×799, alpha) | fornito dal proprietario del prodotto | wordmark completo, per contesti larghi (schermate di benvenuto, export, documentazione) |
| `ux/assets/icon-transparent-512.png` (512×512, alpha) | ritagliato da `logo-full.png` (solo il simbolo a infinito, senza wordmark) | master da cui derivare ogni icona quadrata |
| `ux/assets/icon-transparent-28@2x.png` (56×56, alpha) | ridimensionato dal master | badge nella top bar della shell (28×28px logico, asset a 2× per schermi retina) |
| `ux/assets/favicon.ico` (16/32/48/64px, alpha) | generato dal master | favicon del browser |

Il badge nella top bar (vedi § Shell applicativa) diventa: **28×28px,
`icon-transparent-28@2x.png`, nessuno sfondo colorato dietro** — l'icona ha già il suo
disegno (nero/blu) leggibile direttamente su `color.surface` bianco, non serve un
cerchio a gradiente dietro. Se in futuro serve un badge su sfondo scuro/colorato,
questo stesso asset trasparente funziona anche lì senza modifiche.

`ux/assets/favicon-icon.png`, fornito insieme agli altri, **non è stato usato**: non
ha in realtà canale alpha (sfondo bianco pieno, verificato) nonostante il nome — è
ridondante con gli asset sopra. Lasciato nella cartella ma considerarlo superato;
dimmi se vuoi che lo rimuova.

## Sistema di animazione

Era il pezzo mancante segnalato esplicitamente: React permette animazioni fluide che
un sito statico Canva non ha (il sito non ha alcuna animazione, è una landing page
statica) — qui definiamo lo standard "moderno" da applicare in tutta l'app.

**Libreria**: [Motion for React](https://motion.dev/) (già noto come Framer Motion —
stesso progetto, stesso pacchetto npm `motion`, MIT license). È lo standard de facto
per animazioni React fluide basate su fisica (spring), non semplici transizioni CSS
lineari — è quello che distingue un'interfaccia che "sembra moderna" da una che
sembra un sito con transizioni CSS di base.

### Token di movimento

| Token | Valore | Uso |
|---|---|---|
| `motion.spring.snappy` | `{ type: "spring", stiffness: 500, damping: 35 }` | Micro-interazioni immediate: hover, selezione, toggle |
| `motion.spring.smooth` | `{ type: "spring", stiffness: 300, damping: 30 }` | Pannelli che entrano/escono (Inspector, tray), drag di nodi |
| `motion.spring.bouncy` | `{ type: "spring", stiffness: 400, damping: 18 }` | Comparsa di un nuovo elemento (nodo creato, toast) — un filo di rimbalzo percepibile, mai esagerato |
| `motion.duration.fast` | 120ms, easing `cubic-bezier(0.22,1,0.36,1)` | Fade/opacity puri (non spring) su elementi piccoli: badge, tooltip |
| `motion.duration.base` | 200ms, stessa easing | Fade/opacity su elementi medi: card, dialog backdrop |
| `motion.stagger.list` | 30ms fra elementi | Liste che appaiono (palette, risultati ricerca) — ogni riga entra 30ms dopo la precedente, non tutte insieme |

Regola: **usare spring per qualunque cosa abbia una posizione/scala/dimensione che
cambia** (pannelli, drag, comparsa di card) — dà la sensazione fluida richiesta.
**Usare duration/easing lineare solo per puro fade di opacità** su elementi che non si
muovono. Non animare mai `transform`/`box-shadow` con `transition` CSS generico su
elementi coinvolti nel drag del canvas React Flow (nodi, edge) — coerenza con quanto
già stabilito nel tema Node-RED `deep`: le interazioni di trascinamento devono restare
immediate, mai in ritardo dietro un'animazione.

### Accessibilità del movimento

Ogni animazione rispetta `prefers-reduced-motion`: se attivo, spring e duration
diventano istantanei (durata 0) — mai disabilitare la funzione, solo il movimento.

### Dove il movimento conta di più

- **Comparsa di un nodo/elemento nuovo**: `motion.spring.bouncy` — è il momento in cui
  l'app deve "sembrare viva", coerente col tono del sito (bottoni pill, brand
  energico).
- **Pannelli laterali (Inspector, tray)**: `motion.spring.smooth`, mai un semplice
  `display: none` → `block`.
- **Stati di caricamento → contenuto**: crossfade 200ms fra skeleton e contenuto reale,
  mai uno scatto secco.
- **I glow decorativi** (vedi Asset decorativi) quando presenti in una schermata di
  benvenuto possono avere una deriva lentissima e continua (`translate` ciclico,
  20-30s, loop infinito, opacità mai sopra 0.35) — movimento ambientale, non
  un'animazione che richiede attenzione.

## Convenzioni cross-cutting

Valgono per **ogni** schermata, non ripetute in ciascun documento:

- **Stati vuoti**: mai un'area bianca senza spiegazione. Ogni lista/canvas vuoto mostra
  un'illustrazione minimale (icona grande, 48px, `color.ink-faint`), un titolo
  (`type.heading`) e una singola call-to-action primaria.
- **Stati di caricamento**: skeleton screen (blocchi grigi pulsanti `color.surface-raised`
  → `color.border`), mai uno spinner isolato per contenuto che ha una forma nota.
- **Stati di errore**: mai un semplice testo rosso. Un errore mostra: cosa è successo,
  su cosa (path/target, coerente con gli errori strutturati di S012), e almeno
  un'azione di recupero quando ne esiste una.
- **Conferme distruttive**: ogni azione irreversibile (da S124) usa lo stesso pattern —
  dialogo con `elevation.3`, titolo che nomina il target esplicito (mai "sei sicuro?"
  generico), pulsante di conferma in `color.error`, richiede di scrivere il nome del
  target per azioni con impatto multi-Core.
- **Densità**: l'app è uno strumento tecnico, non un sito marketing — preferire densità
  media (non gli spazi larghi da landing page che abbiamo usato per il tema Node-RED
  `deep`), righe di lista da 40-48px, non 64px+.
- **Tastiera**: ogni azione primaria ha una scorciatoia; la command palette (`⌘K`) è
  disponibile ovunque per navigare fra schermate e Core senza mouse.

## Prossimo passo

`ux/screens/S070-processing-graph-editor/` è ora **confermata "as-built"**: ogni
valore (px, colore, spring, tasti) è stato verificato contro un prototipo React reale
funzionante (React + `@xyflow/react` + Motion for React + Tailwind), non è più una
stima. Questo è il livello di dettaglio e il formato a tre layer da replicare per le
altre dieci schermate elencate sopra — una alla volta o in blocco, quando sei pronto.

Decisioni ancora aperte da chiudere prima di considerare il design system
completo: logo badge a gradiente vs asset reale nella top bar (vedi sopra).

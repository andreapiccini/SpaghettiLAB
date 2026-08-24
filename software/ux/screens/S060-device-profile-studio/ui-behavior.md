# Device Profile Studio — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Tab (Metadata / Transport & Elettrico / Istruzioni / Output)

Cambio tab: crossfade `motion.duration.base` sul contenuto, indicatore attivo del
segmented control scivola con `motion.spring.snappy` — stesso pattern del
selettore vista di `UX-S040`. Lo stato "quale tab" persiste solo per la sessione.

## Sequenza step (Tab Istruzioni)

- Espansione/collasso di una sezione (Identity probe/Init/…): altezza `0→auto`,
  200ms, `cubic-bezier(0.22,1,0.36,1)` — stessa easing anti-jank già usata per
  ogni accordion di questa app.
- **Riordino via drag** della maniglia: durante il drag lo step segue il cursore
  con `motion.spring.smooth` (coerente con "drag di nodi" già definito per il
  canvas — anche se qui non è un canvas, il principio "il drag deve restare
  immediato, mai in ritardo dietro un'animazione" vale allo stesso modo), gli
  altri step si spostano per fare spazio con lo stesso spring. Il numero
  d'ordine di ogni riga si aggiorna immediatamente al termine del drop (nessuna
  animazione sul numero stesso, cambia di colpo — è un dato, non una
  posizione).
- **Nuovo step aggiunto**: entra con `motion.spring.bouncy` (comparsa di un
  elemento nuovo), inserito subito dopo l'ultimo step della sezione.
- **Step eliminato**: esce con `motion.duration.base` (fade), gli step sotto
  scivolano su con `motion.spring.smooth` per richiudere lo spazio.
- **Dettaglio step espanso**: stessa easing 200ms degli accordion, non spring
  (stessa motivazione anti-jank su altezza "auto").
- Validazione locale immediata nel dettaglio step (es. campo durata "wait" non
  numerico, o superiore al timeout massimo consentito): bordo `color.error` +
  messaggio sotto il campo, prima di qualunque verifica che richieda il resto
  del profilo — stesso principio già stabilito per ogni form di questa app.

## Selettore tipo step

Menu a tendina: entra con `motion.duration.fast` (fade + `translateY -4px→0`),
righe con `motion.stagger.list`. Click su un tipo aggiunge subito lo step in
modalità "dettaglio già espanso" (l'utente deve compilarlo, non ha senso
mostrarlo collassato appena creato).

## Pannello Compatibilità

- Cambio esito (es. da `PROFILE_INSTALL_REQUIRED` a `READY` dopo
  un'installazione riuscita): la card vecchia esce e la nuova entra con
  crossfade `motion.duration.base` — mai più di una card visibile
  contemporaneamente durante la transizione (evitare uno stato intermedio
  ambiguo con due esiti sovrapposti).
- Espansione "Vedi dettaglio budget": altezza `0→auto`, 200ms, stessa easing
  degli accordion.
- Nessuna delle sei card pulsa o mostra progresso ciclico — sono esiti stabili
  di un calcolo già completato, non stati di caricamento (il calcolo/verifica
  in corso, se ha una latenza percepibile, è descritto in
  `backend-behavior.md` e usa lo skeleton standard, non un'animazione sulla
  card stessa).

## Badge inline "Opcode non installato"

Nessuna animazione ciclica (stato stabile, non un caricamento). Click su
"Proponi Capability Pack" apre/scrolla al pannello Compatibilità sul lato destro
(stesso `scroll_to` + evidenziazione breve già usato per il banner collisione in
`UX-S050`).

## Dialogo import/export

Stesso comportamento dei dialoghi già confermati in S010/S030: entra con
`motion.spring.smooth`, overlay fade `motion.duration.base`. L'anteprima del
pacchetto (elenco campi/step) usa `motion.stagger.list` per le righe.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

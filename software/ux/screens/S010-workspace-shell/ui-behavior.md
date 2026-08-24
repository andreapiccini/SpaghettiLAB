# Project/Workspace Shell — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione (libreria
[Motion for React](https://motion.dev/)).

## Project Picker

### Hover e selezione di una card progetto

- Hover: la card sale leggermente (`translateY: -2px`) e passa da `elevation.1` a
  `elevation.2`, interpolazione implicita di Motion (nessun token esplicito
  necessario per un semplice hover di elevazione).
- Click: la card si comprime brevemente (`scale: 0.98`) con `motion.spring.snappy`
  prima di navigare — feedback tattile di "è stato registrato il click", non un
  effetto puramente estetico.

### Ricerca

- Filtro client-side istantaneo sul nome del progetto, nessun debounce (il numero di
  progetti in un workspace locale è sempre piccolo).
- Le card filtrate escono/entrano con `motion.duration.fast` (fade, non spring — sono
  card che spariscono/appaiono per filtro, non per un'azione dell'utente su di esse).

### Creazione di un nuovo progetto

1. Click su "+ Nuovo progetto" (o sulla CTA dello stato vuoto) → si apre un dialogo
   modale piccolo (`radius.lg`, `elevation.3`, stesso pattern dei dialoghi già
   confermato in S070) con un solo campo: "Nome progetto".
2. Validazione locale immediata: il campo non può essere vuoto. Bordo `color.error`
   + messaggio `type.caption` sotto il campo se lasciato vuoto e si tenta di
   confermare — stesso principio già stabilito in S070: l'errore di campo isolato
   non ha bisogno del backend.
3. Conferma → il dialogo si chiude (`motion.duration.base`, fade + scale 0.97→1
   invertito in uscita) e si passa alla creazione vera (vedi
   `backend-behavior.md`) — da qui in poi c'è una transizione di caricamento breve,
   non istantanea come la creazione di un nodo in S070, perché comporta un salvataggio.

### Import

1. Click su "Import" → si apre il file picker nativo del sistema operativo (non uno
   step "prima" gestibile via UI custom — è un controllo del browser/OS).
2. Alla selezione di un file: skeleton temporaneo al posto della griglia mentre il
   file viene letto e validato (vedi `backend-behavior.md`) — questo passaggio,
   diversamente dalla creazione di un progetto vuoto, richiede leggere e validare
   contenuto arbitrario, quindi non è istantaneo nemmeno lato client.

## Estensione della top bar: undo/redo

- Click su Undo/Redo (o `⌘Z`/`⌘⇧Z`): l'icona pulsa leggermente (`scale: 1→0.9→1`,
  `motion.spring.snappy`) per confermare che il click è stato ricevuto, indipendente
  dal tempo che l'operazione di dominio impiega a riflettersi (che è comunque
  sincrona per `CommandStack`, vedi `backend-behavior.md`).
- Stato disabilitato: nessuna animazione al click (il pulsante non risponde
  visivamente, oltre al cursore `not-allowed`) — non deve sembrare che sia successo
  qualcosa quando non c'è nulla da annullare/ripetere.
- Tooltip al hover prolungato (400ms): mostra cosa verrebbe annullato/ripetuto (es.
  "Annulla: Aggiungi Core Binding") quando disponibile — rende prevedibile l'azione
  prima di premerla.

## Command palette

1. `⌘K` da qualunque schermata (o click su un'eventuale icona di ricerca globale) →
   overlay e pannello entrano insieme: overlay fade `motion.duration.fast`, pannello
   `opacity 0→1` + `scale 0.97→1` + `translateY -8px→0` con `motion.spring.smooth`.
2. Digitare filtra istantaneamente (client-side, nessun debounce) fra comandi di
   navigazione (vai a schermata X) e azioni disponibili nel contesto corrente
   (es. "Annulla ultima modifica" compare solo se `canUndo()` è vero).
3. Navigazione con frecce ↑/↓, esecuzione con `Invio`, chiusura con `Escape` o click
   fuori dal pannello — nessun mouse necessario per l'intero ciclo.
4. Riga evidenziata: `motion.spring.snappy` sullo spostamento dell'evidenziazione fra
   una riga e la successiva mentre si naviga con le frecce.
5. Chiusura dopo l'esecuzione di un comando: stessa animazione di apertura,
   invertita.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo),
coerente con la regola generale di `UX_ARCHITECTURE.md`.

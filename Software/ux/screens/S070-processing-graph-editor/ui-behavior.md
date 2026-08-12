# Processing Graph Editor — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Ogni voce qui sotto deve continuare a funzionare identica anche se il file
`backend-behavior.md` cambiasse completamente (altro trasporto, altro formato,
altro SDK).

Tutte le animazioni citate usano i token di `UX_ARCHITECTURE.md` § Sistema di
animazione (libreria [Motion for React](https://motion.dev/)) — nessun valore qui è
inventato ad-hoc per questa schermata.

## Drag di un blocco dalla palette al canvas

1. `mousedown` su una riga della palette → parte un elemento "ghost" semi-trasparente
   (opacity 0.6) che segue il cursore.
2. Sopra il canvas, un indicatore a griglia tratteggiata mostra dove il nodo si
   posizionerà (snap a griglia 20px, coerente col prototipo attuale).
3. Al rilascio: il nodo appare immediatamente nel canvas animato con
   `motion.spring.bouncy` (scale 0.9→1, opacity 0→1) — è un momento in cui l'app deve
   "sembrare viva", non un fade piatto. Nessuna chiamata di rete a questo punto — il
   nodo esiste solo nello stato locale del grafo fino al prossimo passaggio (vedi
   `backend-behavior.md` per quando/come questo diventa un comando di dominio).
4. Se il rilascio avviene fuori dal canvas: il ghost torna con un'animazione elastica
   alla riga di partenza nella palette (nessun nodo creato).

## Collegare due nodi

1. `mousedown` su un output handle e trascinamento → appare una linea guida che segue
   il cursore.
2. Passando sopra un handle di input **compatibile** (compatibilità calcolata
   localmente dal `compatibility engine` già caricato in memoria, S042 — nessuna
   chiamata di rete per questo controllo): l'handle si evidenzia `color.success`,
   scala a 1.3× con `motion.spring.snappy`.
3. Passando sopra un handle **incompatibile**: cursore diventa "not-allowed", l'handle
   non si evidenzia.
4. Rilascio su handle compatibile: l'edge si crea con una piccola animazione di
   "disegno" della curva (stroke-dashoffset da 100% a 0%, `motion.duration.base`).
5. Rilascio su handle incompatibile o su area vuota: la linea guida scompare con
   `motion.duration.fast`; se il rilascio era su un handle incompatibile, quell'handle
   pulsa `color.error` con `motion.spring.snappy` (scale 1→1.15→1) come feedback
   dell'errore (nessun toast, il pulse basta).

## Selezione

- Click su un nodo: bordo di selezione 2px `color.brand.blue` attorno alla card,
  elevazione sale a `elevation.2`, l'Inspector si apre da destra (`translateX` da
  +320px a 0 con `motion.spring.smooth`).
- Click su area vuota del canvas: deseleziona, Inspector si chiude con la stessa
  animazione invertita.
- Shift+click: selezione multipla (bordo di selezione su tutti i nodi selezionati,
  Inspector mostra "N nodi selezionati" con le sole azioni comuni: elimina, allinea).

## Modifica di un campo nell'Inspector

Questo è il caso esplicito richiesto: cosa succede **prima** di parlare col backend.

1. L'utente digita in un campo (es. soglia numerica di una Rule).
2. Ad ogni keystroke: validazione locale immediata usando i vincoli del field
   descriptor già caricato (tipo, range, required — S042). Nessuna chiamata di rete.
3. Se il valore è momentaneamente invalido (es. fuori range mentre si sta ancora
   digitando): il bordo del campo diventa `color.error` 1px, appare un messaggio
   `type.caption` sotto il campo, ma **il nodo sul canvas non mostra ancora errore** —
   l'errore di campo isolato e l'errore di validazione del grafo compilato (che arriva
   dal backend, vedi `backend-behavior.md`) sono visivamente distinti apposta.
4. Il valore si applica al modello locale del nodo on-blur (uscita dal campo) o dopo
   500ms di inattività dalla digitazione, quello che avviene prima — non ad ogni
   keystroke, per evitare un comando di dominio per ogni lettera digitata.

## Eliminazione

1. Selezione + tasto `Canc`/`Backspace`, o click sull'icona cestino nell'Inspector.
2. Il nodo/edge sparisce con fade-out `motion.duration.base`.
3. Toast in basso a sinistra per 5 secondi: "Nodo eliminato · Annulla" (pulsante
   testuale `color.brand.blue`). Il toast è puramente presentazionale — l'eventuale
   undo reale è un comando di dominio (S014), descritto in `backend-behavior.md`.

## Pan e zoom

- Standard trackpad/rotellina, nessuna logica custom oltre a quella già presente nel
  prototipo React Flow attuale.
- Lo zoom/posizione del viewport è **stato locale della sessione UI**, non passa mai da
  un comando di dominio (non è undo-abile, non genera traffico di rete) — persiste
  solo se e quando il progetto viene salvato, come metadata di authoring (S013).

## Ricerca nella palette

- Filtro client-side istantaneo, nessun debounce necessario (il set di blocchi
  disponibili è già interamente in memoria, caricato una volta da S042).
- Categorie senza risultati si collassano automaticamente; categorie con risultati si
  espandono automaticamente.
- Le righe risultato appaiono con `motion.stagger.list` (30ms fra una riga e la
  successiva) invece che tutte insieme — coerente con la "vetrina" scelta per il
  brand, ma qui sobria: 30ms è percepibile, non uno spettacolo.

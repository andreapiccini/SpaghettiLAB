# Processing Graph Editor — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

**Stato: confermata come "as-built"** — validata con un prototipo React reale il
2026-08-12 (React + `@xyflow/react` + Motion for React + Tailwind). Ogni animazione
sotto è quella effettivamente implementata e approvata: token esatti, non stime.

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Ogni voce qui sotto deve continuare a funzionare identica anche se il file
`backend-behavior.md` cambiasse completamente (altro trasporto, altro formato,
altro SDK).

## Token di movimento usati in questa schermata

Da `UX_ARCHITECTURE.md` § Sistema di animazione, con i valori concreti confermati:

| Token | Config esatta |
|---|---|
| `motion.spring.snappy` | `{ type: "spring", stiffness: 500, damping: 35 }` |
| `motion.spring.smooth` | `{ type: "spring", stiffness: 300, damping: 30 }` |
| `motion.spring.bouncy` | `{ type: "spring", stiffness: 400, damping: 18 }` |
| `motion.duration.fast` | `120ms` |
| `motion.duration.base` | `200ms`, easing `cubic-bezier(0.22, 1, 0.36, 1)` |
| `motion.stagger.list` | `30ms` per elemento |

Eccezione confermata: l'espansione/collasso di una categoria nella palette usa
`motion.duration.base` (durata, non spring) — animare un'altezza `auto` con uno
spring produce un movimento a scatti, qui la durata fissa è la scelta giusta.

## Left rail: espandi/comprimi

- Click sul pulsante in fondo alla rail → larghezza anima da 64px a 240px (o
  viceversa) con `motion.spring.smooth`.
- L'icona `ChevronRight` ruota 180° in sincrono, con `motion.spring.snappy` (più
  rapida della larghezza — la rotazione dell'icona non deve sembrare "in ritardo").
- Le voci della rail (Core Connections, Catalog & Topology, ecc.) in questo
  prototipo **non navigano da nessuna parte** — sono elementi visivi non interattivi,
  di proposito: la schermata è singola, le altre non esistono ancora. Nell'app reale
  diventeranno link di navigazione veri.

## Drag di un blocco dalla palette al canvas

1. `dragstart` su una riga della palette (l'elemento è nativamente `draggable`, non un
   drag "finto" via mouse events) → l'elemento sorgente scende a opacità 0.6
   (`whileDrag`).
2. Muovendo sopra il canvas: un indicatore tratteggiato 224×48px segue la posizione,
   scattando alla cella di griglia più vicina (20px), con fade-in `motion.duration.fast`
   (120ms, non spring — è un indicatore ausiliario, deve apparire/sparire netto, non
   "rimbalzare").
3. Al rilascio (`drop`): il nodo appare nel canvas animato con `motion.spring.bouncy`
   (scale 0.9→1, opacity 0→1) — è il momento in cui l'app deve "sembrare viva". Nessuna
   chiamata di rete a questo punto — il nodo esiste solo nello stato locale del grafo
   fino al prossimo passaggio (vedi `backend-behavior.md`).
4. Il nuovo nodo viene automaticamente selezionato (deseleziona tutti gli altri) e
   l'Inspector si apre su di esso.
5. Rilascio fuori dal canvas: l'indicatore tratteggiato scompare, nessun nodo creato.

## Collegare due nodi

1. `mousedown` su un handle di uscita e trascinamento → linea guida che segue il
   cursore, colore `#3F77DA`, spessore 2px (stile fisso, non un token semantico).
2. Passando sopra un handle di ingresso **compatibile** (compatibilità calcolata
   localmente dalla matrice categoria→categoria già in memoria — nessuna chiamata di
   rete): l'handle scala a 1.3× con `motion.spring.snappy`, colore `#1F9D55`.
3. Passando sopra un handle **incompatibile**: nessuna evidenziazione, cursore
   "not-allowed" quando il target non è compatibile.
4. Rilascio su handle compatibile: l'edge si disegna con l'animazione di "stroke"
   (stroke-dashoffset 400→0, `motion.duration.base`, 200ms), poi l'edge diventa
   collegamento permanente (dati `isNew` rimossi dopo il disegno).
5. Rilascio su handle incompatibile: **il collegamento viene rifiutato** (non si crea),
   l'handle target pulsa in errore — scala `1→1.15→1` con `motion.spring.snappy`,
   colore `#D6373D` — per **400ms**, poi torna a idle. Nessun toast, il pulse è
   sufficiente come feedback.
6. Un nodo di categoria "Uscita" non ha mai un handle di uscita utilizzabile come
   sorgente di un nuovo collegamento (coerente con la matrice di compatibilità).

## Selezione

- Click su un nodo: outline di selezione 2px `#3F77DA`, ombra sale a `elevation.2`,
  l'Inspector si apre da destra (`translateX` 320px→0, opacity 0→1,
  `motion.spring.smooth`).
- Click su area vuota del canvas: deseleziona tutto, Inspector si chiude
  (`translateX` 0→320px, opacity 1→0, stesso spring, invertito — gestito da
  `AnimatePresence` in "exit").
- Shift+click: selezione multipla — outline su ogni nodo selezionato, Inspector
  mostra "N nodi selezionati" con le sole azioni comuni (allinea, elimina). Il tasto
  di selezione multipla è **Shift**, non Ctrl/Cmd.
- Hover su un nodo (senza click): sale leggermente, `translateY: -1px`, nessuna
  transizione esplicita dichiarata (Motion la interpola di default).

## Modifica di un campo nell'Inspector

Il caso esplicito richiesto: cosa succede **prima** di parlare col backend.

1. L'utente digita in un campo (es. "Soglia (0–100)").
2. Ad ogni keystroke: validazione locale immediata — il valore dev'essere un numero
   fra 0 e 100, altrimenti il bordo del campo diventa `#D6373D` 1px e appare
   "Valore fuori range: usa un numero fra 0 e 100." in 12px sotto il campo. Nessuna
   chiamata di rete.
3. **Il nodo sul canvas non mostra mai questo errore** — l'errore di campo isolato
   (validazione locale immediata) e l'errore di validazione del grafo compilato (che
   arriva dal backend, vedi `backend-behavior.md`) restano visivamente e
   concettualmente separati, di proposito.
4. Il campo "Nome blocco" si applica al modello locale del nodo **on-blur** (uscita
   dal campo), non ad ogni keystroke e non dopo un timeout — più semplice e
   sufficiente per un campo di solo testo breve.

## Eliminazione

1. Selezione + tasto `Canc` **o** `Backspace` (entrambi validi, gestiti da un handler
   custom — il comportamento nativo di React Flow per la cancellazione è
   disattivato apposta per poter mostrare il toast), oppure click su "Elimina nodo"
   nell'Inspector.
2. Il nodo (e gli edge collegati) sparisce, i rimanenti si aggiornano.
3. Toast in basso a sinistra per **5000ms**: "Nodo eliminato" (singolare) o "N nodi
   eliminati" (plurale, selezione multipla) + pulsante testuale "Annulla". Entrata con
   `motion.spring.bouncy` (opacity+y8→0+scale 0.95→1), uscita con fade+y (senza
   rimbalzo in uscita, solo in entrata).

## Pan e zoom

- Standard React Flow, nessuna logica custom.
- Pulsanti dedicati (vedi `visual.md`) animano con **durata esplicita**, non spring:
  zoom in/out 200ms, fit-view 300ms — sono azioni "vai a" con un punto di arrivo
  preciso, uno spring ci metterebbe un tempo variabile e imprevedibile.
- Lo zoom/posizione del viewport è stato locale della sessione UI, non passa mai da un
  comando di dominio (non è undo-abile, non genera traffico di rete) — persiste solo
  se e quando il progetto viene salvato, come metadata di authoring (S013).

## Ricerca nella palette

- Filtro client-side istantaneo, nessun debounce (set di blocchi già in memoria).
- Categoria senza risultati per la query corrente: si disabilita (opacità 45%), non
  scompare.
- Le righe risultato entrano con `motion.spring.snappy` più un ritardo di
  `motion.stagger.list` moltiplicato per l'indice (riga 0 = 0ms, riga 1 = 30ms, riga 2
  = 60ms, ...) — non tutte insieme.
- Hover su una riga: `translateX: +2px`, stessa interpolazione implicita del resto.

## Accessibilità del movimento

Confermato nel prototipo: l'animazione di disegno dell'edge (`sl-draw-edge`) rispetta
`prefers-reduced-motion` impostando la durata a `0ms` quando attivo, senza disabilitare
la funzione (l'edge si crea comunque, solo senza l'animazione). Stesso principio da
applicare a tutte le altre animazioni di questa schermata.

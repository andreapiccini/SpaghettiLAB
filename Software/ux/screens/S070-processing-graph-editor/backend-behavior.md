# Processing Graph Editor — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando di dominio o operazione SDK parte davvero, e come lo stato
loading/success/error/conflict si riflette nella UI. Questo file può cambiare (altro
formato di errore, altro nome di comando) senza che `visual.md` o `ui-behavior.md`
debbano cambiare, finché la forma degli stati esposti resta la stessa.

## Al montaggio della schermata

1. Richiede l'`EditorModel` corrente (S042) per il Core selezionato — necessario prima
   di poter popolare la Node Palette. Stato `loading` → skeleton (vedi `visual.md`).
2. Richiede il Device Processing Graph corrente per quel Core dal Project Store (S014).
   Se il progetto non ha ancora un grafo per questo Core: stato "vuoto" (vedi
   `visual.md`), non un errore.
3. Se il Core non è in stato `READY` (S030): la schermata mostra comunque l'ultimo
   grafo noto (da cache locale) in sola lettura, con il banner di errore di
   caricamento che indica lo stato di sessione reale e un link a Core Connections.

## Creazione di un nodo (drag-drop dalla palette)

- Al rilascio (evento già descritto in `ui-behavior.md`), viene emesso il comando di
  dominio `AddProcessingNode` (S014/S071) con: tipo di blocco, posizione (metadata di
  authoring, S013), valori di default dal field descriptor.
- Il comando è locale e sincrono (nessuna chiamata di rete): entra subito nella cronologia
  undo/redo di S014. Non c'è uno stato "loading" per questa azione — è per questo che
  in `ui-behavior.md` l'animazione di comparsa del nodo è immediata, non condizionata a
  una risposta di rete.

## Creazione di un edge

- Al rilascio su handle compatibile, viene emesso `ConnectProcessingNodes` (S014/S071).
  Anche questo è locale/sincrono — la compatibilità è già stata verificata
  client-side (S042) prima del rilascio, quindi non può fallire per motivi che il
  backend scoprirebbe solo dopo, salvo la validazione completa del grafo (vedi Dry-run
  sotto), che è un passo separato ed esplicito.

## Modifica di un campo nell'Inspector

- L'applicazione del valore al modello locale (descritta in `ui-behavior.md`, on-blur
  o dopo 500ms) emette `SetNodeProperty` (S014/S071). Comando locale/sincrono, undo-abile.
- Nessuna chiamata al Core per un singolo campo modificato — il grafo autore vive
  interamente lato client fino al Dry-run o al Deploy espliciti.

## Dry-run (bottone "Dry-run" nell'header)

1. Click → bottone passa a stato `loading` (spinner al posto del testo, disabilitato).
2. Invoca la pipeline dry-run di S073, che a sua volta usa il compilatore S072 in
   locale (nessuna chiamata al Core per un dry-run — è validazione pura lato client,
   coerente con "il compiler è puro e indipendente dalla UI").
3. **Successo, zero errori**: badge status bar passa a "Valido" (`color.success`),
   bottone "Invia a Deploy" si abilita.
4. **Errori/warning**: status bar mostra il conteggio ("2 errori, 1 warning"); ogni
   errore include il path strutturato (S012) fino al nodo/edge/property originario —
   la UI usa quel path per evidenziare l'edge o il nodo esatto sul canvas (bordo/edge
   `color.error`, vedi `visual.md`) e per mostrare il messaggio nell'Inspector se
   quell'elemento è selezionato.
5. Il bottone "Invia a Deploy" resta disabilitato finché esistono errori (i warning non
   bloccano, coerente con la distinzione errori/warning di S073).

## "Invia a Deploy"

- Non compila né applica nulla da questa schermata. Naviga alla schermata Deploy & Diff
  (S080-deploy-diff, non ancora scritta) passando il grafo già compilato e il suo hash
  — questa schermata non possiede il flusso di applicazione, solo la composizione.

## Undo/redo (⌘Z / ⌘⇧Z)

- Ogni comando emesso sopra (`AddProcessingNode`, `ConnectProcessingNodes`,
  `SetNodeProperty`, rimozioni) passa dal command bus di dominio S014, che è la fonte
  di verità per undo/redo — non uno stack di stato React locale separato. Il toast
  "Annulla" descritto in `ui-behavior.md` invoca lo stesso meccanismo.
- Il pan/zoom del viewport (S013, metadata di authoring) **non** entra in questa
  cronologia undo/redo, coerente con quanto dichiarato in `ui-behavior.md`.

## Riconnessione / cambio Core mentre la schermata è aperta

- Se la sessione del Core cambia stato (S030) mentre l'utente sta editando: il grafo
  autore locale non viene mai sovrascritto automaticamente. Un banner non bloccante
  in cima al canvas segnala il cambio di stato; l'utente resta libero di continuare a
  editare offline e fare Dry-run (che è puramente locale) finché non è pronto per
  tornare alla schermata Deploy.

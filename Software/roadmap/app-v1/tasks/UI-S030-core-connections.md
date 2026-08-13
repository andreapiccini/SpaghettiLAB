# UI-S030 — Core Connections

[← Roadmap](../README.md) · [UX-S030](../../ux-v1/tasks/UX-S030-core-connections.md) ·
[visual.md](../../../ux/screens/S030-core-connections/visual.md) ·
[ui-behavior.md](../../../ux/screens/S030-core-connections/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S030-core-connections/backend-behavior.md)

**Stato: ✅ DONE**

Implementa la schermata dove si connettono, identificano e sincronizzano i Core del
progetto, cablata su `@spaghettilab/core-session` (S030) e `@spaghettilab/protocol-sdk`
reali — nessun dato finto.

## Implementazione

- `packages/app/src/lib/browser-websocket-connection.ts` — adapter che avvolge il
  `WebSocket` nativo del browser nel port `RawMessageConnection` di `protocol-sdk`,
  parallelo (ma distinto) all'adapter Node.js (`ws`) già scritto per
  `node-red-nodes` in S112 — `RawMessageConnection` è pensato per essere
  transport-agnostic, e questo è il secondo adapter reale che lo dimostra.
- `packages/app/src/state/core-sessions-context.tsx` — `CoreSessionsProvider`/
  `useCoreSessions()`, una `Map<CoreBindingId, CoreSession>` in un `useRef` (la
  `CoreSession` è una classe mutabile, non stato React) più un contatore di render
  per forzare il ricalcolo delle righe dopo ogni passo asincrono di `connect()`.
- `packages/app/src/components/core-connections/session-badge.ts` — mappa stato
  sessione/relazione di sync → colore/icona/etichetta, secondo `visual.md`.
- `packages/app/src/components/core-connections/CoreRow.tsx` — riga con chip icona,
  identità, badge stato (pallino pulsante negli stati transitori), badge relazione
  di sync, badge stale, azione secondaria per stato, isolamento errori (bordo rosso
  solo sulla riga in errore), espansione inline per "Rivedi errore"/dettaglio.
- `packages/app/src/components/core-connections/ConnectCoreDialog.tsx` — dialogo con
  selettore metodo (Rilevamento automatico/Indirizzo manuale), validazione locale
  dell'indirizzo, costruzione di un `ConnectionProfile` reale e di un
  `CoreBindingRecord`, `execute(addCoreBinding(...))`.
- `packages/app/src/lib/connection-profile-store.ts` — persistenza per
  `ConnectionProfile` (vedi "Bug reali risolti" sotto).
- `packages/app/src/components/core-connections/CoreConnectionsScreen.tsx` — header
  con conteggio, stato vuoto con glow decorativo, lista righe, wiring del dialogo.
- `App.tsx` — montato `CoreSessionsProvider`, sostituito lo `ScreenStub` di
  `"core-connections"` con la schermata reale.

## Bug reali risolti mentre si cablava questa schermata

1. **`font-body-strong` non esisteva come utility Tailwind.** Ogni pulsante primario
   dell'app (già da UI-S010: "Nuovo progetto", "Deploy", ecc.) referenziava questa
   classe aspettandosi `type.body-strong` (`UX_ARCHITECTURE.md`, 14px/600) — Tailwind
   v4 la ignorava silenziosamente, quindi ogni pulsante primario renderizzava a peso
   normale invece che semibold. Corretto con `@utility font-body-strong` in
   `index.css`. Verificato visivamente: confronto prima/dopo su "Nuovo progetto" nel
   Project Picker.
2. **Nessuna azione di salvataggio esplicito esisteva da nessuna parte nell'app.**
   `backend-behavior.md` di S010 dice esplicitamente che il salvataggio su
   `ProjectRepository` "resta un'azione esplicita separata" dalle modifiche — ma
   nessuno schermo, pulsante o scorciatoia chiamava mai `saveOpenProject()` (rimasta
   codice morto da UI-S010). Risultato reale: aggiungere un Core Binding (o
   qualunque altra modifica) veniva perso al refresh, perché mai scritto in
   `localStorage`. Corretto aggiungendo "Salva progetto" (`⌘S` + voce nella command
   palette) in `CommandPalette.tsx`, con un piccolo toast di conferma/errore —
   verificato dal vivo: aggiunto un Core Binding, salvato con `⌘S`, ricaricata la
   pagina, il binding era ancora presente.
3. **Un fallimento di `connect()` prima che una `CoreSession` esistesse spariva nel
   nulla.** `rowActionLabel()` non considerava mai un errore di connessione
   precedente a un vero stato di sessione — una riga tornava a "Connetti" identica a
   una mai provata, con l'errore salvato ma mai mostrato. Corretto propagando
   `hasError` in `rowActionLabel()` e mostrando un badge "ERRORE" + bordo rosso +
   azione "Rivedi errore" che espande il messaggio reale (verificato dal vivo con un
   indirizzo WebSocket non raggiungibile: `WebSocket connection to
   ws://127.0.0.1:9999 failed`).
4. **`ConnectionProfile` (`domain/src/connection-profile.ts`, con validatore) non
   aveva mai uno store** — nessun modo di risolvere
   `CoreBindingRecord.connectionProfileId` in un host/porta reale per riconnettersi.
   Aggiunto `packages/app/src/lib/connection-profile-store.ts` (namespaced
   `localStorage`, stesso pattern di `LocalStorageAdapter`) — il primo vero
   chiamante di `createConnectionProfile()`. Verificato dal vivo: "Connetti"
   su una riga dopo un reload ha riusato l'indirizzo `ws://127.0.0.1:9999` salvato
   in precedenza, non un valore fabbricato.

## Gap onesti (non risolti in questo task)

- **`CoreBindingRecord` non ha un campo nome visualizzato** (S014) — `visual.md`
  assume "nome Core" sopra l'identificatore tecnico; usato `expectedDeviceId` per
  entrambe le righe (con `lastKnownVariant` se presente), con commento nel codice.
  Estendere il dominio con un campo nome è fuori scope qui.
- **`syncWithProject(project, catalogCompatible)` riceve `true` fisso** per
  `catalogCompatible` — il motore di compatibilità reale (S042) non è ancora
  cablato qui; commentato nel codice (`core-sessions-context.tsx`).
- **"Rilevamento automatico" non fa mai una vera scansione di rete** — impossibile
  da un browser senza un agente locale (stesso ruolo del gateway BLE per Node-RED).
  Il dialogo mostra sempre lo stato vuoto onesto "Nessun Core trovato in rete", mai
  risultati finti.
- **Il campo "Nome Core" è obbligatorio**, non opzionale come da `visual.md`
  ("se vuoto si usa l'identità riportata dal dispositivo") — `CoreSession.connect()`
  richiede `binding.expectedDeviceId` per il controllo di mismatch identità
  *prima* di connettersi, quindi non c'è modo di scoprire l'identità dal
  dispositivo per popolarlo automaticamente senza prima avere un binding. Divergenza
  dichiarata, non un'invenzione silenziosa.
- **`getConnectionProfile()` fallito silenziosamente non mostra errore** — se un
  binding esistente non ha un profilo salvato (non può accadere per binding creati
  da questo dialogo, ma teoricamente possibile per dati importati/migrati), il
  pulsante "Connetti" non fa nulla invece di mostrare un errore esplicito. Non
  affrontato in questo passaggio.

## Verifica

- `docker compose run --rm micro-flow-editor npm run ci` (typecheck + lint + test +
  build) — verde, 0 errori (solo gli stessi 4 warning `react-hooks`/
  `react-refresh` pre-esistenti da UI-S010).
- Verificato dal vivo nel browser (Docker dev server, porta 5173):
  - Stato vuoto con glow decorativo e CTA.
  - Dialogo "Connetti un Core": selettore metodo, stato vuoto "Nessun Core trovato
    in rete" per il rilevamento automatico, validazione locale dell'indirizzo.
  - Connessione a un indirizzo WebSocket non raggiungibile → badge ERRORE, bordo
    rosso isolato sulla riga, "Rivedi errore" espande il messaggio reale.
  - `⌘S` → toast "Progetto salvato" → reload → il Core Binding e il suo
    `ConnectionProfile` sono ancora presenti (round-trip reale via `localStorage`).
  - "Connetti" su un binding dopo il reload riusa l'indirizzo salvato, fallisce di
    nuovo con lo stesso errore reale (non un indirizzo fabbricato).

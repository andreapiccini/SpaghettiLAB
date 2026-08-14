# Core Connections — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Fonte: S030 (Sessioni Core e sincronizzazione, ⬜ TODO — questo file
descrive cosa *dovrebbe* partire una volta implementato, non richiede che esista già,
per la convenzione di `roadmap/ux-v1/README.md`). `DeploymentRecordV1`/`canonicalProjectHash`
già esistenti da S014 (`packages/domain/src/project.ts`, `hash.ts`).

## Caricamento della lista Core (mount)

1. Lettura dell'inventory persistente di Core binding del progetto
   (`ProjectV1.coreBindings`, già disponibile da S014 — non richiede S030).
2. Per ciascun binding, S030 espone lo stato di sessione corrente mantenuto in
   memoria dal Device Session Manager (non persistito — riparte da `DISCONNECTED`
   ad ogni apertura dell'app, coerente con "S030 punto 7: gestisci disconnessione
   ... senza perdere modifiche locali", le modifiche locali restano nel progetto,
   non nella sessione).
3. Se un binding ha un `DeploymentRecordV1` precedente ma la sessione non è mai
   stata riaperta in questa esecuzione dell'app, la riga mostra il badge STALE
   (vedi `visual.md`) finché non riparte la connessione.

## Avvio connessione ("Connetti"/"Riconnetti")

1. S030 avvia la state machine: `DISCONNECTED → CONNECTING → AUTHENTICATING →
   SYNCHRONIZING → READY`, ciascuna transizione riflessa immediatamente nel badge
   di stato della riga (S030 punto 2).
2. Durante `SYNCHRONIZING`, S030 legge identity/status/capability/feature set,
   catalogo paginato con fingerprint coerente, topologia, Config con
   generation/hash e resource report, in quest'ordine (S030 punto 3).
3. Se la connessione fallisce in una qualunque fase, la riga passa a `ERROR` con
   il messaggio strutturato restituito da S030 (path fino al Core, coerente con
   `DomainError` di S012) — non un testo generico "connessione fallita".
4. "Annulla" durante uno stato transitorio invoca la session cancellation di S030
   (punto 7), la riga torna a `DISCONNECTED` senza side effect sul progetto.

## Classificazione sync (badge relazione progetto/dispositivo)

1. Al raggiungimento di `READY`, S030 confronta lo stato letto con l'ultimo
   `DeploymentRecordV1` noto per quel Core (S030 punto 5, usa
   `canonicalProjectHash()`/hash Config di S014 per il confronto) e produce una
   delle cinque classificazioni: `IN_SYNC`, `PROJECT_DIRTY`, `DEVICE_CHANGED`,
   `DIVERGED`, `INCOMPATIBLE`.
2. Questa classificazione non scrive né sul progetto né sul dispositivo (S030
   punto 6) — è pura lettura/confronto, motivo per cui il badge può comparire
   subito dopo `SYNCHRONIZING` senza un'azione dell'utente.

## Azioni per riga

- **"Invia al Core"** (`PROJECT_DIRTY`): avvia il ciclo di compilazione/deploy
  descritto in `REACT_FLOW_ARCHITECTURE.md` § Compilazione e validazione — fuori
  scope di dettaglio qui, coperto da `UX-S080` (Deploy & Diff).
- **"Rivedi modifiche"** (`DEVICE_CHANGED`) / **"Confronta e riconcilia"**
  (`DIVERGED`): espande la riga (vedi `ui-behavior.md`) con l'esito del confronto
  fornito da S030 punto 5; l'utente sceglie esplicitamente fra "importa stato
  live", "conserva progetto" o "riconcilia" (S030 punto 6) — mai una scelta
  automatica.
- **"Dettagli incompatibilità"** (`INCOMPATIBLE`): mostra l'esito del resolver
  Device Profile/Capability Pack descritto in `REACT_FLOW_ARCHITECTURE.md` §
  Device Profile e Capability Pack (`PROFILE_INSTALL_REQUIRED`,
  `FIRMWARE_UPDATE_REQUIRED`, `HARDWARE_INCOMPATIBLE`, `RESOURCE_INCOMPATIBLE`,
  `VERSION_CONFLICT`) — non un messaggio generico "non compatibile".
- **"Rivedi errore"** (`CONFLICT`/`ERROR`): mostra il `DomainError` strutturato
  restituito dalla fase fallita (S012 + S030).
- **"Vedi cosa è cambiato"** (`ROLLED_BACK`): mostra l'esito del ciclo
  `UPDATING → REBOOTING → TRIAL → ROLLED_BACK` (S030 punto 2).

## Isolamento errori

Un Core in `ERROR`/`CONFLICT` non influenza la sessione degli altri Core: S030
punto 8 garantisce che gli altri workspace (le altre righe) restano operativi —
è una garanzia esplicita del backend, non solo una scelta visiva.

## Dialogo "Connetti un Core"

1. "Auto" / "Core via cavo" interrogano le porte USB già autorizzate (Web Serial)
   e `ws://127.0.0.1:8766/list` se `make usb-bridge` è acceso. Ogni Core che
   risponde a `GET_STATUS` **propone** un binding dalla `device_id` del protocollo;
   non sostituisce mai l'identità già registrata (S030 punto 1).
2. Safari non chiama `navigator.serial`. La connessione via cavo passa dal ponte:
   React Flow usa `WebSocketProtocolTransport` su
   `ws://127.0.0.1:8766/core/<device_id>`. Il profilo salvato resta `transport: usb`
   con host = identità; al reconnect si riprova Web Serial, poi il ponte.
3. Alla selezione/conferma, S030 crea un nuovo Core binding nell'inventory
   persistente del progetto (persistito via `ProjectRepository.save()`, S014) e
   avvia immediatamente la connessione (vedi sopra).
4. "Core in rete" salta lo scan USB e passa l'URL WebSocket al transport di S030
   — nessuna differenza nella state machine risultante. Il nome digitato è solo
   un soprannome opzionale.

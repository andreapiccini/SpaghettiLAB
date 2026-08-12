# S024 — Streaming eventi e fixture fake

**Stato:** ✅ DONE
**Dipende da:** S022, S023

## Obiettivo

Rendere osservabili in streaming record ed eventi del Core, e permettere lo sviluppo
dell'applicazione senza hardware fisico.

## Implementazione richiesta

1. Implementa stream eventi con backpressure, unsubscribe, reconnect e segnalazione di
   gap tramite boot ID, sequence e drop counter.
2. Pubblica fixture fake deterministiche per testare l'app senza Core fisico.

## Verifiche

- uno stream sotto pressione applica backpressure invece di accumulare senza limite;
- un reconnect con boot ID cambiato segnala esplicitamente il gap, non lo nasconde;
- le fixture fake riproducono deterministicamente le stesse sequenze fra run di test.

## Fine task

- [x] Streaming e perdita dati sono espliciti, mai silenziosi.
- [x] Fixture e contract test non richiedono rete reale.

## Implementazione (2026-08-12)

`packages/protocol-sdk/src/client/`:

- `event-stream.ts` — `EventStream`, iterabile async (`for await...of` /
  `next()`) sopra un `ProtocolTransport` (S022/S023):
  - **Backpressure reale**: buffer bounded (`capacity`, default 256); a buffer
    pieno l'evento più vecchio viene scartato (mai crescita illimitata) e
    `droppedCount` (sempre interrogabile) si incrementa — mai un drop
    silenzioso.
  - **Gap sul boot ID**: un evento `STATUS` con boot ID diverso dall'ultimo
    noto emette un evento `gap` esplicito (`reason: "boot_id_changed"`) prima
    di riprendere lo stream, e azzera il tracking sequence (coerente con
    `SpaghettiClient`'s reboot handling di S022 — un reboot invalida la
    continuità per ogni sorgente, non solo quella che l'ha segnalato per
    prima).
  - **Gap sulla sequence**: un salto di sequence per la stessa `sourceKey`
    emette `gap` (`reason: "sequence_discontinuity"`) — sorgenti diverse
    tracciate indipendentemente, mai falsi positivi fra sorgenti interlacciate.
  - Payload non decodificabile: scartato in sicurezza, stesso principio già
    usato in S022 per le risposte — mai un crash del canale.
- `fakes/fake-event-fixtures.ts` — builder puri e deterministici
  (`fakeRecordEvent`, `fakeStatusEvent`, `fakeDiscoveryEvent`,
  `fakeConnectivityEvent`, `fakeRecordEventSequence`, `fakeRebootScenario`):
  nessun `Math.random`/orologio di sistema, stessa chiamata produce sempre
  byte identici — provato con test dedicato. Permettono di sviluppare/testare
  l'app senza Core fisico, incluso lo scenario di reboot usato per esercitare
  il rilevamento gap.

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 209
test nel workspace (11 nuovi in `event-stream.test.ts`), build: tutti verdi.

**Questo chiude l'intero gruppo S020 "Protocol SDK e trasporti"** (S021→S024) —
prossimo nel roadmap: S030 (Sessioni Core e sincronizzazione).

# S022 — SpaghettiClient e operazioni firmware

**Stato:** ✅ DONE
**Dipende da:** S021

## Obiettivo

Fornire un client host unico, indipendente dal trasporto, che copre ogni operazione
firmware necessaria alla V1.

## Implementazione richiesta

1. Implementa `SpaghettiClient` con correlation ID, timeout complessivo, replay-aware
   retry, cancellation, paginazione coerente e mapping degli errori pubblici.
2. Implementa tutte le operazioni: catalog/status/topology/config, validate/apply,
   discovery, command, connectivity/maintenance, audit/job, profiles, features,
   resources e update.
3. Mantieni credenziali fuori dagli URL, log ed errori; l'adapter riceve handle dal
   credential store.

## Verifiche

- retry non duplica mutazioni e un correlation conflict è visibile al chiamante;
- catalog pagination che cambia fingerprint a metà lettura riparte da zero;
- reboot durante request/job impedisce replay automatico pericoloso;
- payload malformato, extra key, overflow e timeout sono coperti da test;
- nessuna credenziale compare in log, errori o stringhe URL costruite dal client.

## Fine task

- [x] Ogni operazione firmware necessaria alla V1 è raggiungibile dallo SDK.
- [x] Retry, correlation e paginazione sono corretti sotto fault injection.

## Implementazione (2026-08-12)

`packages/protocol-sdk/src/client/`:

- `transport.ts` — `ProtocolTransport`, porta astratta con `send()` +
  `onResponse()`/`onEvent()` separati (non un unico canale): un trasporto reale
  (S023) sa già distinguere risposta da evento dal proprio framing/topic; questo
  permette a `SpaghettiClient` di correlare le risposte e osservare gli eventi
  `STATUS` per il boot ID senza ambiguità sulla forma wire condivisa.
- `fakes/fake-transport.ts` — `FakeTransport` in memoria per i test, con
  `deliverResponse()`/`deliverEvent()` pilotabili dal test.
- `errors.ts` — `SpaghettiClientError` con `code` chiuso (`TIMEOUT`, `CANCELLED`,
  `CORRELATION_CONFLICT`, `REBOOT_DURING_REQUEST`, `PROTOCOL_ERROR`), mai un
  errore generico da interpretare per stringa.
- `spaghetti-client.ts` — `SpaghettiClient`, tutte le 27 operazioni + helper di
  paginazione (`getFullCatalog`, `getFullTopology`, `getFullDiscoveryList`,
  `getFullAuditLog`, `getFullDeviceProfileList`).
  - **Retry replay-aware**: ogni tentativo della stessa chiamata logica riusa
    lo stesso correlation ID (mai uno nuovo) — è quello che fa sì che una
    mutazione ritentata cada nella finestra di replay del firmware invece di
    essere rieseguita.
  - **Deadline complessivo vs timeout per tentativo**: `defaultTimeoutMs` è il
    budget totale della chiamata (comprese le retry); `attemptTimeoutMs` è il
    tetto per singolo tentativo — senza questa distinzione il primo tentativo
    consumerebbe da solo l'intero budget, lasciando zero margine per i retry.
  - **Status non-OK mai ritentato automaticamente**: un `CONFLICT` (o
    qualunque altro status di errore) rigetta subito come `PROTOCOL_ERROR`,
    visibile al chiamante — mai silenziosamente ritentato.
  - **Reboot durante richiesta**: il client osserva gli eventi `STATUS`; un
    boot ID diverso da quello noto rigetta immediatamente ogni chiamata in
    sospeso con `REBOOT_DURING_REQUEST` — mai un retry cieco oltre il confine
    di un riavvio (la cache di replay del firmware non sopravvive al reboot).
  - **Paginazione con restart su fingerprint**: `getFullCatalog()` scarta le
    pagine già lette e riparte da cursore 0 se il fingerprint cambia a metà
    lettura, mai un risultato incoerente esposto al chiamante.
  - **Payload malformato/chiave extra/oversize**: `handleResponse` cattura e
    scarta silenziosamente una risposta non decodificabile (l'inner decode di
    S021 già rifiuta chiave extra >3 e payload >2048 byte) — la chiamata
    finisce comunque per andare in timeout, mai un crash del canale.
  - **Cancellazione**: `AbortSignal` per chiamata; gestita anche la race in cui
    l'abort avviene durante l'`await` del `send()`, prima che il listener sia
    registrato (controllo esplicito dello stato `aborted` dopo quell'await).
  - **Credenziali**: `SpaghettiClient` non riceve mai un parametro capace di
    contenere un segreto — l'intera superficie pubblica (27 metodi + opzioni)
    non ha alcun campo per credenziali; è il trasporto (S023) a risolverle via
    `CredentialStore` (S121) prima che il client esista.

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 183
test nel workspace (12 nuovi in `spaghetti-client.test.ts`), build: tutti
verdi.

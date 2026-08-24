# S023 — Adapter di trasporto

**Stato:** ✅ DONE
**Dipende da:** S021

## Obiettivo

Muovere i messaggi Protocol V1 su più trasporti fisici mantenendo identica la
semantica di dominio.

## Implementazione richiesta

1. Implementa adapter almeno per MQTT e WebSocket/BLE gateway.
2. Definisci interfacce per USB/WebSerial o trasporto locale senza duplicare
   semantica del client.

## Verifiche

- MQTT e WebSocket/BLE, alimentati con lo stesso golden vector, producono esattamente
  gli stessi oggetti di dominio;
- un adapter di trasporto non contiene logica di Config o di catalogo, solo trasporto
  byte/messaggi.

## Fine task

- [x] Almeno due trasporti (MQTT, WebSocket/BLE) sono implementati e testati.
- [x] Trasporti non contengono logica Config o catalogo.

## Implementazione (2026-08-12)

`packages/protocol-sdk/src/client/transports/`, tre adapter, tutti implementano
`ProtocolTransport` (S022) senza bisogno di alcun caso speciale nel client:

- `mqtt-transport.ts` — `MqttProtocolTransport`, un topic per direzione
  (request/response/event) su una porta `MqttConnection` astratta (nessuna
  libreria MQTT reale come dipendenza — chi cablerà una connessione vera
  inietterà un adapter verso `mqtt.js` o simile).
- `websocket-transport.ts` — `WebSocketProtocolTransport` su una porta
  `RawMessageConnection` — copre anche "WebSocket/BLE gateway": un gateway BLE
  che incanala gli stessi byte su WebSocket è indistinguibile da questo
  adapter. Le risposte in ingresso serve un byte di "kind" (`framing.ts`) per
  distinguerle dagli eventi, dato che l'envelope ha la stessa forma per
  entrambi; l'invio (sempre request) non ha bisogno di framing.
- `webserial-transport.ts` — `WebSerialProtocolTransport`, la richiesta esplicita
  di S023 ("definisci interfacce per USB/WebSerial ... senza duplicare
  semantica del client"): stessa interfaccia `ProtocolTransport`, ma su una
  porta `RawByteStreamConnection` con `StreamFrameDecoder` (kind byte + prefisso
  di lunghezza uint32) perché un flusso seriale non ha confini di messaggio
  propri come WebSocket — un chunk puà spezzare o unire più frame, e il
  decoder li riassembla correttamente in entrambi i casi (testato).
- `framing.ts` — convenzione di framing condivisa fra WebSocket e WebSerial.

**Verifica di parità** (`__tests__/cross-transport-parity.test.ts`): lo stesso
envelope codificato viene fatto arrivare sia via `MqttProtocolTransport` sia via
`WebSocketProtocolTransport`, entrambi dietro un `SpaghettiClient` reale — gli
oggetti di dominio decodificati risultano identici (`toEqual`), provando che
nessun adapter altera/reinterpreta i byte. Ogni adapter è inoltre deliberatamente
minuscolo (poche righe, solo trasporto) — nessuna logica di Config o catalogo in
nessuno dei tre, verificato per ispezione oltre che dal fatto che nessun modulo
`transports/` importa nulla da `operations/config.ts` o `operations/catalog.ts`.

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 198
test nel workspace (15 nuovi), build: tutti verdi.

# S023 — Adapter di trasporto

**Stato:** ⬜ TODO
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

- [ ] Almeno due trasporti (MQTT, WebSocket/BLE) sono implementati e testati.
- [ ] Trasporti non contengono logica Config o catalogo.

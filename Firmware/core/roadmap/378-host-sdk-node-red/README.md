# Fase 378 — SDK host e contratto Node-RED

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Fornire una sola implementazione TypeScript del Protocol V1 e definire come più nodi
Node-RED condividono connessione, catalogo e Config senza sovrascriversi.

## Task

1. ⬜ [TASK-378-01 — Creare SDK host e contratto Node-RED](TASK-378-01-creare-sdk-host-e-contratto-node-red.md)

## Criteri di completamento della fase

- [ ] MQTT e BLE/gateway usano la stessa API TypeScript.
- [ ] CBOR, errori, retry, paginazione e int64 sono implementati una sola volta.
- [ ] Un solo Config Coordinator esegue read/merge/validate/CAS apply.
- [ ] Catalog cache viene invalidata dal fingerprint dopo OTA.
- [ ] Golden vector sono condivisi con firmware e CLI Python.

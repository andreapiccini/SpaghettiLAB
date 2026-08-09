# Fase 150 — CBOR

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Decodificare un payload CBOR V0 rigoroso nel modello Config interno.

## Dipende da

[Fase 140 — Communication](../140-communication/README.md)

## Risultato visibile

Un payload CBOR valido viene applicato; payload incompleti o extra vengono rifiutati.

## Task

1. ⬜ [TASK-150-01 — Decodificare Config con CBOR](TASK-150-01-decodificare-config-con-cbor.md)

## Criteri di completamento della fase

- [ ] Lo schema V0 è documentato prima del decoder.
- [ ] Il decoder non applica direttamente la configurazione.
- [ ] Limiti, campi obbligatori e valori sconosciuti sono provati.

# Fase 360 — Communication Protocol V1

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Definire un unico envelope CBOR versionato per catalogo, stato, Config, Discovery e
comandi, riusabile da trasporti locali e remoti con permessi espliciti.

## Task

1. ⬜ [TASK-360-01 — Implementare il protocollo macchina V1](TASK-360-01-implementare-il-protocollo-macchina-v1.md)

## Criteri di completamento della fase

- [ ] Correlation ID ed errori sono identici su ogni trasporto.
- [ ] Catalogo e schema permettono a un client di non conoscere il firmware a priori.
- [ ] Policy locale/remota impediscono operazioni non autorizzate.

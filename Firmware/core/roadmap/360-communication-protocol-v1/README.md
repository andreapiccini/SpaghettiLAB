# Fase 360 — Communication Protocol V1

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Definire un unico envelope CBOR versionato per catalogo, stato, capability, Config,
Discovery, connettività, reset e comandi, riusabile da trasporti locali e remoti con
principal, permessi espliciti, errori pubblici stabili e replay protection centrale.

## Task

1. ⬜ [TASK-360-01 — Implementare il protocollo macchina V1](TASK-360-01-implementare-il-protocollo-macchina-v1.md)

## Criteri di completamento della fase

- [ ] Correlation ID, replay ed errori pubblici sono identici su ogni trasporto.
- [ ] Catalogo e schema permettono a un client di non conoscere il firmware a priori.
- [ ] GET/VALIDATE/APPLY Config supportano merge host e compare-and-swap.
- [ ] Operazioni lunghe usano job bounded senza bloccare i callback di rete.
- [ ] Policy locale/remota impediscono operazioni non autorizzate.
- [ ] Capability, diagnostica e stato connettività sono leggibili senza segreti.

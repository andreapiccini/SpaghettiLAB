# Fase 330 — Config e wire V2

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Rendere Config indipendente dai driver concreti, aggiungere encoder CBOR e salvare un
record canonico versionato invece di una struct C grezza.

## Task

1. ⬜ [TASK-330-01 — Generalizzare Config, CBOR e Storage](TASK-330-01-generalizzare-config-cbor-e-storage.md)

## Criteri di completamento della fase

- [ ] Il codec V2 non contiene confronti con `ina219` o `relay`.
- [ ] Più schedule e proprietà driver vengono validate tramite schema.
- [ ] Storage salva byte canonici con lunghezza e CRC.
- [ ] Snapshot espone generazione/hash e apply compare-and-swap evita conflitti.
- [ ] Config identica non causa scritture flash né una nuova generazione.
- [ ] Policy connettività/energia è persistente, mentre lease e deadline non lo sono.

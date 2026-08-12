# Fase 340 — Data, Runtime e regole V2

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Distribuire record di qualunque schema, campionare più Module e trasformare la regola
di soglia in un plug-in anziché in logica INA219/Relay centrale.

## Task

1. ⬜ [TASK-340-01 — Generalizzare Data, Runtime e regole](TASK-340-01-generalizzare-data-runtime-e-regole.md)

## Criteri di completamento della fase

- [ ] zbus trasporta record generici.
- [ ] Runtime pianifica più schedule indipendenti.
- [ ] La soglia è una rule auto-registrata e non conosce driver concreti.
- [ ] Record generici raggiungono il confine di consegna senza dipendere dall'adapter.
- [ ] Runtime espone il confine record necessario ai Block Driver della fase 342.

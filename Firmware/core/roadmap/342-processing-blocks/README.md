# Fase 342 — Blocchi di elaborazione dichiarativi

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Eseguire sul Core pipeline bounded composte da blocchi firmware catalogati, mentre il
Config descrive istanze e collegamenti senza introdurre codice nuovo.

## Task

1. ⬜ [TASK-342-01 — Implementare graph e Block Registry](TASK-342-01-implementare-blocchi-elaborazione-dichiarativi.md)

## Criteri di completamento della fase

- [ ] I blocchi si auto-registrano e dichiarano schema, costi e stato.
- [ ] Config rappresenta un DAG validabile, non un grafo UI-specifico.
- [ ] Pipeline aritmetiche e stateful elaborano record generici.
- [ ] Un tipo di blocco assente è rifiutato prima dell'apply.

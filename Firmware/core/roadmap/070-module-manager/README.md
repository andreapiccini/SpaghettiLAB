# Fase 070 — Module Manager

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Gestire un pool statico di Module, consentendo più endpoint sulla stessa Port.

## Dipende da

[Fase 060 — Driver Registry](../060-driver-registry/README.md)

## Risultato visibile

Due chiamate configurano INA219 `0x40` e `0x41` sulla stessa Port 0 e li leggono per ID.

## Task

1. ⬜ [TASK-070-01 — Implementare il Module Manager](TASK-070-01-implementare-il-module-manager.md)

## Criteri di completamento della fase

- [ ] Gli slot hanno un solo proprietario e non contengono un context universale.
- [ ] Key ed endpoint duplicati falliscono; Port ripetute sono accettate.
- [ ] Configurazioni fallite eseguono rollback.
- [ ] Letture su slot non pronti falliscono in modo controllato.

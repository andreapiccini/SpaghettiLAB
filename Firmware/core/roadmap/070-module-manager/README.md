# Fase 070 — Module Manager

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Gestire configurazione, vita e lettura di un modulo in uno slot.

## Dipende da

[Fase 060 — Driver Registry](../060-driver-registry/README.md)

## Risultato visibile

Una chiamata Manager configura Port 0 come SHT40 e legge il sensore.

## Task

1. ⬜ [TASK-070-01 — Implementare il Module Manager](TASK-070-01-implementare-il-module-manager.md)

## Criteri di completamento della fase

- [ ] Lo stato dello slot ha un solo proprietario.
- [ ] Configurazioni fallite eseguono rollback.
- [ ] Letture su slot non pronti falliscono in modo controllato.

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

1. ⬜ [TASK-070-01 — Dichiarare l’API di Module Manager](TASK-070-01-declare-the-module-manager-api.md)
2. ⬜ [TASK-070-02 — Implementare lo stato Manager con uno slot](TASK-070-02-implement-the-one-slot-manager-state.md)
3. ⬜ [TASK-070-03 — Implementare la configurazione nel Manager](TASK-070-03-implement-manager-configure.md)
4. ⬜ [TASK-070-04 — Implementare la lettura nel Manager](TASK-070-04-implement-manager-read.md)
5. ⬜ [TASK-070-05 — Integrare Manager con Core e main](TASK-070-05-integrate-manager-into-core-and-main.md)
6. ⬜ [TASK-070-06 — Provare successo e rollback del Manager](TASK-070-06-test-manager-success-and-rollback.md)

## Criteri di completamento della fase

- [ ] Lo stato dello slot ha un solo proprietario.
- [ ] Configurazioni fallite eseguono rollback.
- [ ] Letture su slot non pronti falliscono in modo controllato.

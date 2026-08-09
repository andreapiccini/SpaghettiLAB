# Fase 190 — Power

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Gestire una risorsa di alimentazione condivisa con ownership e rollback espliciti.

## Dipende da

[Fase 180 — Varianti Core multiple](../180-multi-core/README.md)

## Risultato visibile

La risorsa cambia stato correttamente con due proprietari e durante gli errori.

## Task

1. ⬜ [TASK-190-01 — Verificare l’hardware di alimentazione controllabile](TASK-190-01-verify-controllable-power-hardware.md)
2. ⬜ [TASK-190-02 — Definire l’API pubblica di Power](TASK-190-02-define-the-power-public-api.md)
3. ⬜ [TASK-190-03 — Implementare il reference counting con backend finto](TASK-190-03-implement-reference-counting-with-a-fake-backend.md)
4. ⬜ [TASK-190-04 — Provare proprietà e rollback di Power](TASK-190-04-test-power-ownership-and-rollback-logic.md)
5. ⬜ [TASK-190-05 — Collegare Power al controllo hardware reale](TASK-190-05-connect-power-to-the-real-control.md)
6. ⬜ [TASK-190-06 — Integrare Power con Manager e provare l’hardware](TASK-190-06-integrate-power-with-manager-and-test-hardware.md)

## Criteri di completamento della fase

- [ ] L’hardware controllabile è verificato prima del driver reale.
- [ ] Il reference counting viene provato con backend finto.
- [ ] Manager acquisisce e rilascia Power in ogni percorso di successo o errore.

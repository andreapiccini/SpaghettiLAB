# Fase 050 — Module + Module Driver

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Separare l’identità del modulo dalle operazioni specifiche del driver SHT40.

## Dipende da

[Fase 040 — Sezione verticale SHT40](../040-sht40/README.md)

## Risultato visibile

SHT40 viene usato soltanto tramite una tabella di operazioni.

## Task

1. ⬜ [TASK-050-01 — Definire l’istanza minima di Module](TASK-050-01-define-the-minimal-module-instance.md)
2. ⬜ [TASK-050-02 — Definire il contratto temporaneo del campione](TASK-050-02-define-the-temporary-sample-contract.md)
3. ⬜ [TASK-050-03 — Definire la tabella operazioni di Module Driver](TASK-050-03-define-the-module-driver-operation-table.md)
4. ⬜ [TASK-050-04 — Dichiarare il descrittore del driver SHT40](TASK-050-04-declare-the-sht40-driver-descriptor.md)
5. ⬜ [TASK-050-05 — Adattare SHT40 alle operazioni del driver](TASK-050-05-adapt-sht40-to-driver-operations.md)
6. ⬜ [TASK-050-06 — Usare SHT40 tramite la tabella operazioni](TASK-050-06-exercise-sht40-through-the-operation-table.md)

## Criteri di completamento della fase

- [ ] Instance, sample e tabella operazioni hanno contratti espliciti.
- [ ] Il descrittore SHT40 è immutabile.
- [ ] Il chiamante non dipende più direttamente dal wrapper.

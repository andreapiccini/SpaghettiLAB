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

1. ⬜ [TASK-050-01 — Introdurre Module e Module Driver](TASK-050-01-introdurre-module-e-driver.md)

## Criteri di completamento della fase

- [ ] Instance, sample e tabella operazioni hanno contratti espliciti.
- [ ] Il descrittore SHT40 è immutabile.
- [ ] Il chiamante non dipende più direttamente dal wrapper.

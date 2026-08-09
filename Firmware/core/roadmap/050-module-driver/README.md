# Fase 050 — Module + Module Driver

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Separare l’identità del modulo dalle operazioni specifiche del driver INA219 e
normalizzare bus voltage, current e power in un campione copiabile.

## Dipende da

[Fase 040 — Sezione verticale INA219](../040-ina219/README.md)

## Risultato visibile

INA219 viene usato soltanto tramite una tabella di operazioni.

## Task

1. ⬜ [TASK-050-01 — Introdurre Module e Module Driver](TASK-050-01-introdurre-module-e-driver.md)

## Criteri di completamento della fase

- [ ] Instance, sample e tabella operazioni hanno contratti espliciti.
- [ ] Il descrittore INA219 è immutabile.
- [ ] Il chiamante non dipende più direttamente dal wrapper.

# Fase 030 — Port

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Creare l’astrazione Port 0 e associarla al device I2C pronto di Zephyr.

## Dipende da

[Fase 020 — Scheda attuale / I2C](../020-board-i2c/README.md)

## Risultato visibile

Port 0 espone capacità I2C e restituisce un device pronto.

## Task

1. ⬜ [TASK-030-01 — Definire l’identificatore di Port](TASK-030-01-define-the-port-identifier.md)
2. ⬜ [TASK-030-02 — Definire le capacità di Port](TASK-030-02-define-port-capabilities.md)
3. ⬜ [TASK-030-03 — Dichiarare l’API pubblica di Port](TASK-030-03-declare-the-port-public-api.md)
4. ⬜ [TASK-030-04 — Implementare il descrittore privato di Port](TASK-030-04-implement-the-private-port-descriptor.md)
5. ⬜ [TASK-030-05 — Associare Port 0 al device I2C](TASK-030-05-bind-port-0-to-the-i2c-device.md)
6. ⬜ [TASK-030-06 — Aggiungere Port alla build CMake](TASK-030-06-add-port-to-cmake.md)
7. ⬜ [TASK-030-07 — Inizializzare Port da Core](TASK-030-07-initialize-port-from-core.md)
8. ⬜ [TASK-030-08 — Provare Port con ID validi e non validi](TASK-030-08-test-port-success-and-invalid-ids.md)

## Criteri di completamento della fase

- [ ] ID e capacità Port hanno tipi pubblici chiari.
- [ ] Il descrittore hardware resta privato.
- [ ] ID non validi e device non pronti producono errori precisi.

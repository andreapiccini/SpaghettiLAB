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

1. ⬜ [TASK-030-01 — Implementare Port 0](TASK-030-01-implementare-port-zero.md)

## Criteri di completamento della fase

- [ ] ID e capacità Port hanno tipi pubblici chiari.
- [ ] Il descrittore hardware resta privato.
- [ ] ID non validi e device non pronti producono errori precisi.

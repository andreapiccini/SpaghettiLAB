# Fase 040 — Sezione verticale SHT40

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Leggere un sensore SHT40 reale usando inizialmente il driver Sensor di Zephyr.

## Dipende da

[Fase 030 — Port](../030-port/README.md)

## Risultato visibile

Temperatura e umidità reali compaiono nei log.

## Task

1. ⬜ [TASK-040-01 — Leggere il sensore SHT40](TASK-040-01-leggere-il-sensore-sht40.md)

## Criteri di completamento della fase

- [ ] Il nodo temporaneo SHT40 corrisponde al binding installato.
- [ ] Il wrapper controlla `device_is_ready()`.
- [ ] Build e prova hardware restituiscono campioni plausibili.

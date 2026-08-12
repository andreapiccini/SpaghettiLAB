# Fase 320 — Module Driver V2

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Fare in modo che un nuovo driver porti config, record, comandi e registrazione senza
modificare tabelle o tipi specifici nel firmware centrale.

## Task

1. ⬜ [TASK-320-01 — Rendere i Module Driver auto-descrittivi](TASK-320-01-rendere-i-module-driver-auto-descrittivi.md)

## Criteri di completamento della fase

- [ ] Driver Registry usa iterable sections Zephyr.
- [ ] INA219 e Relay implementano il contratto V2.
- [ ] Letture, eventi e comandi usano valori tipizzati.
- [ ] Il contratto può ospitare il driver generico dei Device Profile della fase 325.

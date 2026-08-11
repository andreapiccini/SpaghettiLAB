# Fase 260 — Manutenzione locale dalla base

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Usare la base per provisioning e recovery senza USB, con un ingresso fisico non
attivabile da un sensore.

## Task

1. ⬜ [TASK-260-01 — Aggiungere provisioning e update UART dalla base](TASK-260-01-aggiungere-la-manutenzione-uart.md)

## Criteri di completamento della fase

- [ ] Il pinmux cambia soltanto dopo la richiesta fisica verificata.
- [ ] Runtime e Module sono fermi prima di lasciare I2C.
- [ ] Config/Wi-Fi e firmware usano frame bounded e versionati.
- [ ] Timeout ripristina I2C e scarta upload incompleti.

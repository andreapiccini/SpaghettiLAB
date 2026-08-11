# Fase 220 — Contratto hardware update

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Trasformare i “tre pin” in un contratto elettrico verificabile prima di scrivere codice
che cambia il pinmux o interrompe I2C.

## Task

1. ⬜ [TASK-220-01 — Congelare il contratto hardware dei tre segnali](TASK-220-01-congelare-il-contratto-hardware-update.md)

## Criteri di completamento della fase

- [ ] Schema, connettore, GPIO, tensioni e safe state sono documentati.
- [ ] È confermato se i tre pin sono segnali oppure includono alimentazione/massa.
- [ ] Il segnale di richiesta non può essere attivato accidentalmente da un sensore.
- [ ] UART temporanea su GPIO3/GPIO4 è elettricamente compatibile con la base.

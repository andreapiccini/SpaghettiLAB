# Fase 230 — MCUboot e A/B

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Costruire e avviare immagini firmate con MCUboot usando gli slot flash già presenti.

## Task

1. ⬜ [TASK-230-01 — Attivare MCUboot e le immagini A/B firmate](TASK-230-01-attivare-mcuboot-e-ab.md)

## Criteri di completamento della fase

- [ ] Sysbuild produce bootloader e applicazione firmata.
- [ ] La chiave privata non è nel repository.
- [ ] Slot primario, secondario, scratch e storage non si sovrappongono.
- [ ] Il primo provisioning completo via USB avvia MCUboot e l'applicazione.

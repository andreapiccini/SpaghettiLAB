# Fase 325 — Profili dispositivo dichiarativi

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Permettere di aggiungere dispositivi I2C, SPI, UART, GPIO e analogici descrivendo
transazioni, campi e conversioni in un profilo bounded, senza compilare un driver per
ogni modello di sensore.

## Task

1. ⬜ [TASK-325-01 — Implementare profili dispositivo e acquisition plan](TASK-325-01-implementare-profili-dispositivo-dichiarativi.md)

## Criteri di completamento della fase

- [ ] Un solo Module Driver generico esegue profili per più dispositivi e trasporti.
- [ ] Profili e Config di installazione hanno identità, versione e ownership separate.
- [ ] Ogni piano è validato e bounded prima di qualsiasi I/O.
- [ ] Un nuovo profilo compatibile non richiede aggiornamento firmware.

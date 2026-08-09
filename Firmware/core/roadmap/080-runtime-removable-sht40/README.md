# Fase 080 — SHT40 rimovibile a runtime

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Rimuovere l’identità statica SHT40 dal Devicetree mantenendo la lettura reale.

## Dipende da

[Fase 070 — Module Manager](../070-module-manager/README.md)

## Risultato visibile

SHT40 viene configurato a runtime tramite Port, indirizzo e parametri limitati.

## Task

1. ⬜ [TASK-080-01 — Definire la configurazione runtime di SHT40](TASK-080-01-define-the-sht40-runtime-configuration.md)
2. ⬜ [TASK-080-02 — Passare al Manager una configurazione driver limitata](TASK-080-02-pass-bounded-driver-configuration-through-manager.md)
3. ⬜ [TASK-080-03 — Implementare la misura SHT40 direttamente su I2C](TASK-080-03-implement-direct-i2c-sht40-measurement.md)
4. ⬜ [TASK-080-04 — Convalidare il CRC e convertire i campioni SHT40](TASK-080-04-validate-crc-and-convert-sht40-samples.md)
5. ⬜ [TASK-080-05 — Rimuovere la scorciatoia Sensor statica](TASK-080-05-remove-the-static-sensor-shortcut.md)
6. ⬜ [TASK-080-06 — Eseguire il test di regressione di SHT40 runtime](TASK-080-06-regression-test-the-runtime-sht40.md)

## Criteri di completamento della fase

- [ ] Il driver usa trasferimenti I2C diretti.
- [ ] CRC, conversioni e tempi rispettano il datasheet.
- [ ] Non rimangono scorciatoie Sensor/Devicetree specifiche di SHT40.

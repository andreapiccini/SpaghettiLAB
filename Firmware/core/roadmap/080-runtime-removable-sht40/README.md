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

1. ⬜ [TASK-080-01 — Rendere SHT40 configurabile a runtime](TASK-080-01-rendere-sht40-configurabile-a-runtime.md)

## Criteri di completamento della fase

- [ ] Il driver usa trasferimenti I2C diretti.
- [ ] CRC, conversioni e tempi rispettano il datasheet.
- [ ] Non rimangono scorciatoie Sensor/Devicetree specifiche di SHT40.

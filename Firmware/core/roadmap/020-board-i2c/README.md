# Fase 020 — Scheda attuale / I2C

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Descrivere e abilitare il controller I2C realmente collegato agli Spaghetti Port.

## Dipende da

[Fase 010 — Core](../010-core/README.md)

## Risultato visibile

Il Devicetree generato contiene il controller I2C reale, con pin e stato corretti.

## Task

1. ⬜ [TASK-020-01 — Verificare controller e pin I2C reali](TASK-020-01-verify-the-real-i2c-controller-and-pins.md)
2. ⬜ [TASK-020-02 — Ispezionare il Devicetree generato](TASK-020-02-inspect-the-current-generated-devicetree.md)
3. ⬜ [TASK-020-03 — Abilitare I2C nell’overlay della scheda](TASK-020-03-enable-the-i2c-node-in-the-board-overlay.md)
4. ⬜ [TASK-020-04 — Abilitare il supporto I2C di Zephyr](TASK-020-04-enable-zephyr-i2c-support.md)
5. ⬜ [TASK-020-05 — Controllare la configurazione I2C generata](TASK-020-05-inspect-generated-i2c-configuration.md)
6. ⬜ [TASK-020-06 — Caricare e provare la baseline I2C](TASK-020-06-flash-the-i2c-baseline.md)

## Criteri di completamento della fase

- [ ] Controller e pin sono verificati sullo schema reale.
- [ ] L’overlay contiene soltanto dati hardware statici.
- [ ] `CONFIG_I2C=y` e il nodo abilitato compaiono nei file generati.

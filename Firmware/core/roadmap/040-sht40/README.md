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

1. ⬜ [TASK-040-01 — Esaminare il driver SHT4x fornito da Zephyr](TASK-040-01-inspect-the-installed-sht4x-driver.md)
2. ⬜ [TASK-040-02 — Aggiungere il nodo Devicetree temporaneo di SHT40](TASK-040-02-add-the-temporary-sht40-devicetree-node.md)
3. ⬜ [TASK-040-03 — Abilitare l’API Sensor di Zephyr](TASK-040-03-enable-the-sensor-api.md)
4. ⬜ [TASK-040-04 — Dichiarare l’API del wrapper temporaneo SHT40](TASK-040-04-declare-the-temporary-sht40-wrapper-api.md)
5. ⬜ [TASK-040-05 — Implementare il wrapper temporaneo SHT40](TASK-040-05-implement-the-temporary-sht40-wrapper.md)
6. ⬜ [TASK-040-06 — Aggiungere il wrapper SHT40 a CMake](TASK-040-06-add-the-sht40-wrapper-to-cmake.md)
7. ⬜ [TASK-040-07 — Chiamare il wrapper SHT40 da main](TASK-040-07-call-the-sht40-wrapper-from-main.md)
8. ⬜ [TASK-040-08 — Compilare e ispezionare l’immagine SHT40](TASK-040-08-build-and-inspect-the-sht40-image.md)
9. ⬜ [TASK-040-09 — Caricare e provare il sensore SHT40 reale](TASK-040-09-flash-and-test-the-real-sht40.md)

## Criteri di completamento della fase

- [ ] Il nodo temporaneo SHT40 corrisponde al binding installato.
- [ ] Il wrapper controlla `device_is_ready()`.
- [ ] Build e prova hardware restituiscono campioni plausibili.

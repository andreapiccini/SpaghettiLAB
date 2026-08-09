# Fase 000 — Baseline

[← Indice del backlog](../README.md)

**Stato:** ✅ DONE

## Obiettivo

Confermare che ambiente, build, flash e console funzionino prima di modificare il firmware.

## Dipende da

Nessuna fase precedente.

## Risultato visibile

Il firmware iniziale viene compilato, caricato e osservato sulla console seriale.

## Task

1. ✅ [TASK-000-01 — Compilare l’applicazione senza modifiche](TASK-000-01-build-the-untouched-application.md)
2. ✅ [TASK-000-02 — Caricare e osservare la baseline](TASK-000-02-flash-and-observe-the-baseline.md)

## Criteri di completamento della fase

- [ ] La build produce `build/zephyr/zephyr.bin`.
- [ ] Il firmware viene caricato sulla scheda corretta.
- [ ] La console mostra avvio e uptime a 115200 baud.

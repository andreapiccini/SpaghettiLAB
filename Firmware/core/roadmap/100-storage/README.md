# Fase 100 — Config persistente

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Salvare e ricaricare soltanto la Config interna già validata.

## Dipende da

[Fase 090 — Config interna](../090-config/README.md)

## Risultato visibile

La configurazione valida sopravvive a un riavvio reale.

## Task

1. ⬜ [TASK-100-01 — Definire l’API di storage sincrono](TASK-100-01-define-the-synchronous-storage-api.md)
2. ⬜ [TASK-100-02 — Implementare e provare il backend storage RAM](TASK-100-02-implement-and-test-a-ram-storage-backend.md)
3. ⬜ [TASK-100-03 — Verificare e definire la partizione di storage](TASK-100-03-verify-and-define-the-storage-partition.md)
4. ⬜ [TASK-100-04 — Abilitare Zephyr Settings e il relativo backend](TASK-100-04-enable-zephyr-settings-and-its-backend.md)
5. ⬜ [TASK-100-05 — Implementare il record persistente con Settings](TASK-100-05-implement-the-settings-backed-storage-record.md)
6. ⬜ [TASK-100-06 — Caricare Config all’avvio e provare la persistenza](TASK-100-06-load-config-at-boot-and-test-persistence.md)

## Criteri di completamento della fase

- [ ] Il contratto storage è provato prima con backend RAM.
- [ ] La partizione flash non si sovrappone ad altre regioni.
- [ ] Record assente o corrotto ha un comportamento deterministico.

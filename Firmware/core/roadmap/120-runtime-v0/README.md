# Fase 120 — Runtime V0

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Spostare il campionamento periodico da `main` a un servizio Runtime dedicato.

## Dipende da

[Fase 110 — Data / zbus](../110-data-zbus/README.md)

## Risultato visibile

Runtime campiona ogni 1000 ms mentre `main` esegue soltanto il boot.

## Task

1. ⬜ [TASK-120-01 — Definire l’API del task di campionamento Runtime](TASK-120-01-define-the-runtime-sampling-task-api.md)
2. ⬜ [TASK-120-02 — Implementare timer e semaforo del periodo](TASK-120-02-implement-the-one-period-timer-service.md)
3. ⬜ [TASK-120-03 — Implementare il thread di campionamento Runtime](TASK-120-03-implement-the-runtime-sampling-thread.md)
4. ⬜ [TASK-120-04 — Implementare caricamento, avvio e arresto di Runtime](TASK-120-04-implement-runtime-load-start-and-stop.md)
5. ⬜ [TASK-120-05 — Integrare Runtime con Core e Config](TASK-120-05-integrate-runtime-with-core-and-config.md)
6. ⬜ [TASK-120-06 — Rimuovere il loop da main e verificare la cadenza](TASK-120-06-remove-the-sampling-loop-from-main-and-test-cadence.md)

## Criteri di completamento della fase

- [ ] Il timer non esegue I/O.
- [ ] Il thread possiede il campionamento e pubblica tramite Data.
- [ ] Start, stop e nuova configurazione hanno semantica definita.

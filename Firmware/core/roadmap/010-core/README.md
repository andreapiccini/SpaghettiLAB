# Fase 010 — Core

[← Indice del backlog](../README.md)

**Stato:** 🟨 IN PROGRESS

## Obiettivo

Introdurre il più piccolo confine di avvio indipendente dalla board.

## Dipende da

[Fase 000 — Baseline](../000-baseline/README.md)

## Risultato visibile

`main` inizializza Core e App/Core producono log Zephyr distinti.

## Task

1. ✅ [TASK-010-01 — Definire l’API pubblica di Core](TASK-010-01-define-the-core-public-api.md)
2. ⬜ [TASK-010-02 — Implementare stato e inizializzazione di Core](TASK-010-02-implement-core-state-and-initialization.md)
3. ⬜ [TASK-010-03 — Aggiungere Core alla build dell’applicazione](TASK-010-03-add-core-to-the-application-build.md)
4. ⬜ [TASK-010-04 — Chiamare Core da main](TASK-010-04-call-core-from-main.md)
5. ⬜ [TASK-010-05 — Organizzare i log del firmware](TASK-010-05-structure-firmware-logging.md)
6. ⬜ [TASK-010-06 — Definire le convenzioni per tipi ed errori](TASK-010-06-define-component-type-and-error-conventions.md)
7. ⬜ [TASK-010-07 — Compilare e provare il confine di Core](TASK-010-07-build-and-flash-the-core-boundary.md)

## Criteri di completamento della fase

- [ ] L’API pubblica Core resta indipendente dalla board.
- [ ] Core è compilato e chiamato una sola volta da `main`.
- [ ] Log, tipi ed errori seguono le convenzioni del progetto.

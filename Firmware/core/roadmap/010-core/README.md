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

1. 🟨 [TASK-010-01 — Implementare il confine Core](TASK-010-01-implementare-il-confine-core.md)

## Criteri di completamento della fase

- [ ] L’API pubblica Core resta indipendente dalla board.
- [ ] Core è compilato e chiamato una sola volta da `main`.
- [ ] Log, tipi ed errori seguono le convenzioni del progetto.

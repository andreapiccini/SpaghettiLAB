# Fase 110 — Data / zbus

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Distribuire campioni immutabili a più consumer tramite zbus.

## Dipende da

[Fase 100 — Config persistente](../100-storage/README.md)

## Risultato visibile

Un campione reale raggiunge logger e un secondo consumer.

## Task

1. ⬜ [TASK-110-01 — Distribuire i campioni con zbus](TASK-110-01-distribuire-i-campioni-con-zbus.md)

## Criteri di completamento della fase

- [ ] Il messaggio contiene solo dati copiabili e con unità definite.
- [ ] Canale e subscriber hanno capacità limitate.
- [ ] Backpressure e code piene sono provate esplicitamente.

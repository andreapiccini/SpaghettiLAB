# Fase 140 — Communication

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Esporre richieste limitate attraverso un primo trasporto locale sostituibile.

## Dipende da

[Fase 130 — Relay + Runtime V1](../130-relay-runtime-v1/README.md)

## Risultato visibile

Zephyr Shell legge lo stato e invia bytes di configurazione.

Lo stato elenca zero o più Module per Port con key, ID, tipo ed endpoint.

## Task

1. ⬜ [TASK-140-01 — Aggiungere la comunicazione Shell](TASK-140-01-aggiungere-la-comunicazione-shell.md)

## Criteri di completamento della fase

- [ ] Messaggi e buffer hanno dimensioni massime.
- [ ] Il dispatch non dipende dalla Shell.
- [ ] Input malformati vengono rifiutati senza modificare lo stato.

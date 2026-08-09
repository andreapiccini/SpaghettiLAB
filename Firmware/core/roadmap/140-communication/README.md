# Fase 140 — Communication

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Esporre richieste limitate attraverso un primo trasporto locale sostituibile.

## Dipende da

[Fase 130 — Relay + Runtime V1](../130-relay-runtime-v1/README.md)

## Risultato visibile

Zephyr Shell legge lo stato e invia bytes di configurazione.

## Task

1. ⬜ [TASK-140-01 — Definire messaggi Communication a dimensione limitata](TASK-140-01-define-bounded-communication-messages.md)
2. ⬜ [TASK-140-02 — Dichiarare e implementare il dispatch delle richieste](TASK-140-02-declare-and-implement-request-dispatch.md)
3. ⬜ [TASK-140-03 — Abilitare Zephyr Shell](TASK-140-03-enable-the-zephyr-shell.md)
4. ⬜ [TASK-140-04 — Implementare l’adattatore di trasporto Shell](TASK-140-04-implement-the-shell-transport-adapter.md)
5. ⬜ [TASK-140-05 — Inizializzare Communication da Core](TASK-140-05-initialize-communication-from-core.md)
6. ⬜ [TASK-140-06 — Provare stato e input Shell non valido](TASK-140-06-test-status-and-malformed-shell-input.md)

## Criteri di completamento della fase

- [ ] Messaggi e buffer hanno dimensioni massime.
- [ ] Il dispatch non dipende dalla Shell.
- [ ] Input malformati vengono rifiutati senza modificare lo stato.

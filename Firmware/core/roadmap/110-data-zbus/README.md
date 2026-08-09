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

1. ⬜ [TASK-110-01 — Definire il messaggio del campione di temperatura](TASK-110-01-define-the-temperature-sample-message.md)
2. ⬜ [TASK-110-02 — Abilitare i subscriber di zbus](TASK-110-02-enable-zbus-message-subscribers.md)
3. ⬜ [TASK-110-03 — Definire il canale temperatura e i subscriber](TASK-110-03-define-the-temperature-channel-and-subscribers.md)
4. ⬜ [TASK-110-04 — Inizializzare Data e pubblicare un messaggio](TASK-110-04-implement-data-initialization-and-publish.md)
5. ⬜ [TASK-110-05 — Pubblicare i campioni reali del Manager](TASK-110-05-publish-real-manager-samples.md)
6. ⬜ [TASK-110-06 — Provare fan-out e backpressure di zbus](TASK-110-06-test-zbus-fan-out-and-backpressure.md)

## Criteri di completamento della fase

- [ ] Il messaggio contiene solo dati copiabili e con unità definite.
- [ ] Canale e subscriber hanno capacità limitate.
- [ ] Backpressure e code piene sono provate esplicitamente.

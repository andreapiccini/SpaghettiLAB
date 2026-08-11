# Fase 250 — Boot sicuro

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Separare boot senza Config, esecuzione normale e prova di una nuova immagine.

## Task

1. ⬜ [TASK-250-01 — Definire il boot sicuro con e senza Config](TASK-250-01-definire-il-boot-sicuro.md)

## Criteri di completamento della fase

- [ ] Config assente non avvia rete, Runtime o update.
- [ ] Config valida avvia il normale Engine con update chiuso.
- [ ] L'immagine di prova viene confermata solo dopo health check.
- [ ] Watchdog/reset provoca rollback se la prova non arriva a READY.

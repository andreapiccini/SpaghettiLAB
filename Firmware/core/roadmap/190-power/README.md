# Fase 190 — Power

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Gestire una risorsa di alimentazione condivisa con ownership e rollback espliciti.

## Dipende da

[Fase 180 — Varianti Core multiple](../180-multi-core/README.md)

## Risultato visibile

La risorsa cambia stato correttamente con due proprietari e durante gli errori.

I proprietari sono Module ID distinti anche quando condividono la stessa Port.

## Task

1. ⬜ [TASK-190-01 — Gestire l’alimentazione condivisa](TASK-190-01-gestire-l-alimentazione-condivisa.md)

## Criteri di completamento della fase

- [ ] L’hardware controllabile è verificato prima del driver reale.
- [ ] Il reference counting viene provato con backend finto.
- [ ] Manager acquisisce e rilascia Power in ogni percorso di successo o errore.

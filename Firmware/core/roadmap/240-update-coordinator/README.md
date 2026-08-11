# Fase 240 — Coordinatore aggiornamenti

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Possedere stato, timeout e policy dell'aggiornamento indipendentemente dal trasporto.

## Task

1. ⬜ [TASK-240-01 — Implementare il coordinatore sicuro degli aggiornamenti](TASK-240-01-implementare-il-coordinatore-update.md)

## Criteri di completamento della fase

- [ ] Un solo aggiornamento può essere attivo.
- [ ] Un timeout scarta soltanto l'immagine secondaria.
- [ ] Il vecchio firmware resta avviabile.
- [ ] Nessuna Config persistente forza uno stato transitorio.

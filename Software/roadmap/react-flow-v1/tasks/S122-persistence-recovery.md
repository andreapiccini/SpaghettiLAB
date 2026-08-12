# S122 — Persistenza robusta: autosave, backup e concorrenza

**Stato:** ⬜ TODO
**Dipende da:** S121

## Obiettivo

Rendere impossibile perdere lavoro per un crash, una migration fallita o due schede
aperte sullo stesso progetto.

## Implementazione richiesta

1. Implementa project autosave transazionale, version history bounded, backup prima di
   migration, crash recovery e controllo concorrenza fra tab/processi.

## Verifiche

- un crash durante una migration conserva una copia recuperabile del progetto;
- due tab concorrenti sullo stesso progetto non lo corrompono;
- l'autosave è transazionale: un salvataggio interrotto non lascia un file a metà.

## Fine task

- [ ] Backup, migration e crash recovery sono provati con test dedicati.
- [ ] La concorrenza fra tab/processi non può corrompere il Project.

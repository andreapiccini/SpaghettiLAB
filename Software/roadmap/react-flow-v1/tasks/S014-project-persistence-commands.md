# S014 — ProjectV1, persistenza e comandi con undo/redo

**Stato:** ⬜ TODO
**Dipende da:** S013

## Obiettivo

Rendere il Project persistibile, versionabile e modificabile in modo deterministico e
reversibile.

## Implementazione richiesta

1. Definisci `ProjectV1`, schema JSON canonico, validatore runtime, import/export,
   migration registry, hashing e golden file.
2. Definisci command/event per modificare il dominio con undo/redo deterministico.

## Verifiche

- round-trip e migration di Project golden;
- hash non cambia per ordine non significativo o metadata visuali esclusi;
- undo/redo riproduce esattamente lo stato precedente/successivo, incluse sequenze
  miste di comandi su entità diverse.

## Fine task

- [ ] Project V1 e migration policy sono documentati e testati.
- [ ] Ogni mutazione del dominio passa da un comando con undo/redo, nessuna mutazione
      diretta non tracciata.

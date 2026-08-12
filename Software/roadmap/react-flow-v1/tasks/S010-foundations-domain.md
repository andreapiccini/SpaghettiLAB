# S010 — Fondazioni e modello di dominio

**Stato:** ⬜ TODO

## Obiettivo

Creare la base TypeScript indipendente da UI, rete e storage sulla quale costruire
tutte le funzioni successive.

## Implementazione richiesta

1. Trasforma `micro-flow-editor` in workspace con package separati almeno per
   `domain`, `protocol-sdk`, `project-store`, `react-flow-adapter` e applicazione.
2. Abilita TypeScript strict, lint, formatter, unit test, coverage e build CI
   riproducibile; congela versioni Node/package manager e lockfile.
3. Definisci value object e ID branded per Project, Core binding, Module, Profile,
   Schedule, Rule, Block, edge, deployment e Node-RED resource.
4. Definisci i tre modelli distinti: Physical Composition, Device Processing e System
   Automation Graph. Rifiuta riferimenti fra layer non consentiti.
5. Definisci `ProjectV1`, schema JSON canonico, validatore runtime, import/export,
   migration registry, hashing e golden file.
6. Separa authoring metadata da dati deployabili: coordinate, viewport, selezione,
   commenti e grouping non entrano mai nel Config firmware.
7. Definisci errori strutturati con codice, severity, path, target, remediation e causa;
   nessun servizio successivo restituisce soltanto stringhe.
8. Definisci command/event per modificare il dominio con undo/redo deterministico.
9. Definisci porte astratte per clock, UUID, storage, credentials, logger e audit in
   modo che i test non dipendano dal browser.

## Verifiche

- round-trip e migration di Project golden;
- ID duplicati, riferimenti dangling e graph layer errato sono rifiutati;
- hash non cambia per ordine non significativo o metadata visuali esclusi;
- undo/redo riproduce esattamente lo stato;
- domain package non importa React, React Flow, transport o API browser.

## Fine task

- [ ] Workspace e quality gate funzionano da checkout pulito.
- [ ] Project V1 e migration policy sono documentati e testati.
- [ ] Tutte le entità dell'architettura hanno ownership e ID stabili.
- [ ] Errori e comandi di dominio sono utilizzabili senza UI.


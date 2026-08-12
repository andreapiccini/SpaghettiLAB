# S011 — Workspace, tooling e porte infrastrutturali

**Stato:** ⬜ TODO

## Obiettivo

Preparare la base tecnica (workspace, qualità, porte astratte) su cui tutto il resto del
dominio verrà costruito, senza ancora definire tipi di dominio.

## Implementazione richiesta

1. Trasforma `micro-flow-editor` in workspace con package separati almeno per
   `domain`, `protocol-sdk`, `project-store`, `react-flow-adapter` e applicazione.
2. Abilita TypeScript strict, lint, formatter, unit test, coverage e build CI
   riproducibile; congela versioni Node/package manager e lockfile.
3. Definisci porte astratte per clock, UUID, storage, credentials, logger e audit in
   modo che i test non dipendano dal browser.

## Verifiche

- `domain` package non importa React, React Flow, transport o API browser;
- ogni porta astratta ha almeno un'implementazione fake usabile nei test;
- build CI riproducibile da checkout pulito, senza step manuali.

## Fine task

- [ ] Workspace e quality gate funzionano da checkout pulito.
- [ ] Le porte astratte non hanno dipendenze da browser/React.
- [ ] Lockfile e versioni Node/package manager sono congelate e documentate.

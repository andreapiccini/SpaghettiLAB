# S011 — Workspace, tooling e porte infrastrutturali

**Stato:** ✅ DONE

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

- [x] Workspace e quality gate funzionano da checkout pulito.
- [x] Le porte astratte non hanno dipendenze da browser/React.
- [x] Lockfile e versioni Node/package manager sono congelate e documentate.

## Implementazione (2026-08-12)

Workspace npm (`packages/*`) con 5 package: `domain` (porte astratte + fake +
test, zero dipendenze da React/React Flow/browser, verificato), `protocol-sdk`,
`project-store`, `react-flow-adapter` (placeholder, contenuto reale nei task
S021+/S014/S043), `app` (il prototipo React Flow esistente, spostato qui).
TypeScript strict condiviso (`tsconfig.base.json`), ESLint flat config +
typescript-eslint, Prettier, Vitest con coverage v8. Node 24.19.0 e npm 11.17.0
congelati in `engines` + pinnati nel `Dockerfile`. Pipeline CI riproducibile
(`npm run ci` = lint → typecheck → test → build) verificata da container Docker
pulito (`docker compose build --no-cache` + volume `node_modules` ricreato).
TypeScript pinnato a `5.9.3` invece di `7.x`: `typescript-eslint` non supporta
ancora TS 7 (peer range `<6.1.0`), quindi si resta sull'ultima 5.x stabile
finché l'ecosistema non recupera.

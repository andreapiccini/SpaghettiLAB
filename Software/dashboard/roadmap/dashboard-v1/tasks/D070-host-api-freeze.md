# D070 — Congelamento HOST_API

**Stato:** ✅ DONE (2026-08-16)
**Dipende da:** D051

## Obiettivo

Congelare contratto V1 allineato a dashboard **presentation-only**.

## Implementazione richiesta

1. Audit: endpoints usati vs `HOST_API.md`.
2. Confermare **assenza** endpoint regole/automazioni.
3. Documentare JSON per: appearance, apply-pack, `point_updated` con `visualState`.
4. Versione header: `Host API V1`.

## Verifiche

- FakeHost conforme;
- nessun leak firmware nel contratto pubblico;
- automazioni documentate come responsabilità host/Node-RED, non API UI.

## Fine task

- [x] `HOST_API.md` V1 congelata + changelog.

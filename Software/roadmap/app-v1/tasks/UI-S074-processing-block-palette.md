# UI-S074 — Palette catalogo blocchi funzionali

[← Roadmap](../README.md) · [S074](../../react-flow-v1/tasks/S074-processing-block-catalog.md) ·
[visual.md](../../../ux/screens/S070-processing-graph-editor/visual.md)

**Stato: ✅ DONE**

Sostituisce i quattro pulsanti "+ tipo" e il testo libero `blockTypeId`/`ruleTypeId`
della Processing Graph con la palette da 260px di S070, alimentata da
`@spaghettilab/processing-block-catalog`.

## Implementazione

- `ProcessingBlockPalette` — ricerca, categorie accordion, drag nativo e click.
  Righe `shipped`/`pack`/`planned` Core-local si piazzano; Node-RED / Features /
  admin / fuori scope restano visibili ma non trascinabili, con la ragione in
  tooltip e badge.
- Drop sul canvas con snap 20px; il nodo nasce già col `type_id`/kind giusti e
  apre l'Inspector.
- Inspector: select dal catalogo, note del mapping, avviso sui driver `planned`.
- Dry-run passa `shippedTypeIds()` come `availableBlockRuleTypeIds`.

## Verifica

- `npm run test -w @spaghettilab/processing-block-catalog`
- typecheck/lint del workspace

# S041 — Normalizzazione catalogo e topologia

**Stato:** ✅ DONE
**Dipende da:** S030

## Obiettivo

Trasformare i dati grezzi letti dal Core in indici immutabili e coerenti, senza ancora
costruire nulla di specifico per l'editor.

## Implementazione richiesta

1. Normalizza catalog pages in indici immutabili per Module Driver, Rule, Block,
   opcode, Profile, operation, schema, field, command e Capability Pack.
2. Normalizza Flow, Port, Function Bay, cinque segnali, rail e admission della
   topologia senza GPIO hardcoded.

## Verifiche

- catalog page lette in ordine differente producono lo stesso indice normalizzato;
- una rail dichiarata `UNVERIFIED` dal Core non viene normalizzata come `ENFORCED`;
- catalogo/topologia parziali (lettura interrotta) non producono un indice
  apparentemente completo.

## Fine task

- [x] Catalogo e topologia normalizzati sono indipendenti dall'ordine di lettura.
- [x] Nessun GPIO o tipo concreto è hardcoded nella normalizzazione.

## Implementazione (2026-08-13)

Nuovo package `@spaghettilab/catalog-model`, sopra `@spaghettilab/protocol-sdk`
(S021), nessun I/O.

### Scostamento onesto dal criterio originale

Il task chiede di normalizzare "Module Driver, Rule, Block, opcode, Profile,
operation, schema, field, command e Capability Pack" — ma il Protocol V1 così
com'è implementato oggi espone sul wire **solo** Module Driver
(`typeId`/`commandCount`), Profile e Capability Pack: ogni schema descriptor delle
27 operazioni è vuoto (`.fields = NULL, .field_count = 0`, scoperta già
documentata nella nota di implementazione di S021). Non esiste quindi alcun dato
di Rule/Block/opcode/operation/schema/field/command da normalizzare — costruire
indici vuoti "segnaposto" per queste entità sarebbe stato codice speculativo senza
dati reali dietro, quindi non l'ho fatto. Il package normalizza esattamente ciò
che il protocollo espone davvero oggi; documentato esplicitamente nel README del
package, non nascosto.

### Cosa è stato implementato

`packages/catalog-model/src/`:
- `catalog-index.ts` — `normalizeCatalogPages()`: deduplica per `typeId`,
  ordina, indipendente dall'ordine delle pagine in ingresso.
- `profile-index.ts` — `normalizeProfilePages()`: deduplica per
  `profileId`+`version` insieme (la stessa ID può avere più versioni installate).
- `capability-pack-index.ts` — `normalizeCapabilityPacks()`: `GET_FEATURES` non è
  paginato, quindi è sempre una lettura completa; ordina per `id`.
- `topology-index.ts` — `normalizeTopologyPages()`: Flow→Function Bay→rail,
  **`admission`/`assurance` passati invariati**, mai promossi/retrocessi fra
  `UNVERIFIED` ed `ENFORCED` (per costruzione — la funzione non ha alcuna logica
  che potrebbe farlo). Nessun campo GPIO in nessun punto: il wire protocol stesso
  non ne espone, quindi non c'è nulla da hardcodare. `Port` è ricavato come
  insieme degli ID distinti referenziati dai Flow, unico dato Port disponibile sul
  wire.

Ogni normalizzatore accetta un flag `complete: boolean` fornito dal chiamante
(sa se la paginazione è arrivata in fondo) e lo propaga verbatim — mai inferito,
mai una lettura interrotta che sembra completa.

`docker compose run --rm micro-flow-editor npm run ci` — lint, typecheck, 255 test
nel workspace (17 nuovi in `@spaghettilab/catalog-model`), build: tutti verdi.

# S074 — Catalogo blocchi funzionali del processing graph

**Stato:** ✅ DONE
**Dipende da:** S071, S073; UI in UI-S074

## Obiettivo

Sostituire i 11 blocchi placeholder della palette S070 con il catalogo funzionale
reale: Library AppBlocks mappata sui quattro node kind firmware (schedule,
event-source, Block, Rule), più i Block Driver SpaghettiLAB che AppBlocks non ha.

## Implementazione

Pacchetto `@spaghettilab/processing-block-catalog`:

- le voci AppBlocks con analogo SpaghettiLAB hanno un mapping; i blocchi vendor-only
  sono omessi, non listati come driver finti;
- i `typeId` shipped coincidono con `spaghetti_blocks/` e la Rule `threshold`;
- Kalman e Modbus restano Capability Pack, non driver finti nell'immagine minima;
- Features (Debug Print, variabili, timer object) restano `feature` fino al dump
  della tab Features;
- LCD, SMS e for-next illimitato non diventano driver Core.

`GET_CATALOG` continua a elencare solo i Module Driver: questo catalogo è la fonte
host di Block/Rule finché il wire non li espone. Un Block `planned` si può autorare;
il dry-run avvisa se il `type_id` non è fra quelli shipped.

## Verifiche

- gli `appblocksId` presenti sono unici; i blocchi vendor-only non compaiono;
- ogni `type_id` firmware di `processing-basic` / `processing-kalman` / Rule
  `threshold` compare nel catalogo;
- for-next, LCD e HTTP non sono piazzabili sul Device Processing Graph.

## Fine task

- [x] Catalogo puro, testato, senza React.
- [x] Palette Processing Graph alimentata dal catalogo, non da testo libero.

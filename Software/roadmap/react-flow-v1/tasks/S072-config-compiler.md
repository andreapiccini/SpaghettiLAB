# S072 — Compilatore Config deterministico

**Stato:** ⬜ TODO
**Dipende da:** S071

## Obiettivo

Trasformare il grafo di processing validato nel modello Config canonico del Core, in
modo deterministico e senza alcun dettaglio React Flow.

## Implementazione richiesta

1. Calcola limiti Module/Schedule/Rule/Block/edge/property, state/workspace e costo
   dichiarato per record; segnala il proprietario che supera il budget.
2. Compila in ordine deterministico key stabili, array normalizzati e property set;
   coordinate, grouping e label restano nel Project.
3. Implementa canonical JSON debug, CBOR tramite SDK (S021) e hash riproducibile.

## Verifiche

- la stessa semantica con ordine o coordinate diversi produce lo stesso Config e lo
  stesso hash;
- una pipeline multi-stage con fan-out, filtro stateful e Rule→command compila
  correttamente;
- un grafo che supera un budget dichiarato fallisce con l'owner indicato, non con un
  errore generico.

## Fine task

- [ ] Tutte le sezioni Config firmware previste dalla V1 sono producibili dal
      compilatore.
- [ ] Compiler è puro, deterministico e indipendente dalla UI.
- [ ] Nessun dettaglio React Flow (posizione, viewport, selezione) attraversa il wire.

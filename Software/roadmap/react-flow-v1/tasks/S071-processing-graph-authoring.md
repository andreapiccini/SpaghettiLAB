# S071 — Authoring e validazione del processing graph

**Stato:** ⬜ TODO
**Dipende da:** S043, S050; usa S063 quando presenti Device Profile

## Obiettivo

Comporre il comportamento locale bounded del Core come grafo autore, rifiutando ciò
che non può mai compilare in un Config valido.

## Implementazione richiesta

1. Implementa authoring di schedule, event source, Block, Rule, command target,
   publish output ed edge usando esclusivamente catalogo/schema.
2. Risolvi tipi, unità, reference group, source/target key, field ID, command ID e
   versioni. Inserimenti di conversione devono essere espliciti nel dominio.
3. Rifiuta cicli; feedback temporale usa Block stateful/delay catalogati. Controlla
   input required, fan-out, duplicati e riferimenti dangling.
4. Mantieni System Automation Graph escluso: edge fra Core differenti è errore e viene
   indirizzato alla fase S110.

## Verifiche

- un ciclo nel grafo è rifiutato con errore che punta al nodo/edge coinvolto;
- type/unit mismatch fra due Block collegati è rifiutato prima della compilazione;
- un edge cross-Core creato per errore è rifiutato, non silenziosamente ignorato.

## Fine task

- [ ] Il grafo di processing autore rifiuta cicli, riferimenti dangling e duplicati.
- [ ] Nessun edge cross-Core può entrare nel grafo locale.

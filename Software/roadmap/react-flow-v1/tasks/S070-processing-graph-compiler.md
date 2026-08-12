# S070 — Processing graph e compilatore Config

**Stato:** ⬜ TODO
**Dipende da:** S040, S050; usa S060 quando presenti Device Profile

## Obiettivo

Comporre comportamento locale bounded e compilarlo nel modello Config canonico del
Core senza serializzare dettagli React Flow.

## Implementazione richiesta

1. Implementa authoring di schedule, event source, Block, Rule, command target,
   publish output ed edge usando esclusivamente catalogo/schema.
2. Risolvi tipi, unità, reference group, source/target key, field ID, command ID e
   versioni. Inserimenti di conversione devono essere espliciti nel dominio.
3. Rifiuta cicli; feedback temporale usa Block stateful/delay catalogati. Controlla
   input required, fan-out, duplicati e riferimenti dangling.
4. Calcola limiti Module/Schedule/Rule/Block/edge/property, state/workspace e costo
   dichiarato per record; segnala il proprietario che supera il budget.
5. Compila in ordine deterministico key stabili, array normalizzati e property set;
   coordinate, grouping e label restano nel Project.
6. Implementa decompiler/import dal Config live verso un grafo funzionale, marcando ciò
   che non può recuperare metadata authoring senza inventarli.
7. Implementa canonical JSON debug, CBOR tramite SDK e hash riproducibile.
8. Mantieni System Automation Graph escluso: edge fra Core differenti è errore e viene
   indirizzato alla fase S110.
9. Fornisci dry-run completo con elenco errori/warning e remediation per profilo o pack
   assente.

## Verifiche

- stessa semantica con ordine/coordinate differenti produce lo stesso Config/hash;
- pipeline multi-stage, fan-out, filtro stateful e Rule→command compilano;
- ciclo, type/unit mismatch, budget e block version errata falliscono;
- decompile→compile conserva semanticamente un Config supportato;
- edge cross-Core non entra accidentalmente nel Config locale.

## Fine task

- [ ] Tutte le sezioni Config firmware sono producibili dall'editor.
- [ ] Compiler e validator sono puri e indipendenti dalla UI.
- [ ] Errori puntano al nodo/edge/property originale.
- [ ] Nessun dettaglio React Flow attraversa il wire.


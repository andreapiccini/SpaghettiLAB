# S013 — I tre grafi e i confini fra layer

**Stato:** ✅ DONE
**Dipende da:** S012

## Obiettivo

Definire i tre modelli distinti dell'architettura e impedire che si mescolino fra loro
o con i metadati di authoring.

## Implementazione richiesta

1. Definisci i tre modelli distinti: Physical Composition, Device Processing e System
   Automation Graph. Rifiuta riferimenti fra layer non consentiti.
2. Separa authoring metadata da dati deployabili: coordinate, viewport, selezione,
   commenti e grouping non entrano mai nel Config firmware.

## Verifiche

- un riferimento creato fra layer non consentiti (es. Device Processing → System
  Automation) è rifiutato con errore strutturato (da S012);
- rimuovere/alterare i soli metadati di authoring non cambia l'identità né il contenuto
  deployabile delle entità di dominio.

## Fine task

- [x] I tre grafi hanno ownership separata e non condividono serializzazione.
- [x] Nessun metadato di authoring può raggiungere il Config firmware.

## Implementazione (2026-08-12)

`packages/domain/src/`: `graph-layer.ts` (`GraphLayer`: physical-composition/
device-processing/system-automation), `graph.ts` (`Graph<Layer,Id,EdgeId,Data>`
— rifiuta nodi/edge di layer diverso con `CROSS_LAYER_REFERENCE`, edge con
endpoint non registrato con `DANGLING_EDGE_ENDPOINT`, nodo duplicato con
`DUPLICATE_NODE`; più `deployableSnapshot()` per confronti indipendenti
dall'ordine), `authoring-metadata.ts` (`AuthoringMetadataStore<Id>`, store
completamente separato da `Graph` — `GraphNode.data` non ha alcun campo per
posizione/viewport/selezione/commento/gruppo, quindi non c'è percorso perché
raggiungano il Config). Verificato con test che l'edge Device Processing →
System Automation viene rifiutato, e che alterare/rimuovere metadati di
authoring non cambia `deployableSnapshot()`. 37 test, 96% coverage sui file
nuovi.

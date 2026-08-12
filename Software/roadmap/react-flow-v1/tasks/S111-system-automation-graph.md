# S111 — System Automation Graph e compatibility engine

**Stato:** ⬜ TODO
**Dipende da:** S043, S080, S093

## Obiettivo

Definire come si rappresenta un collegamento fra Core distinti, senza ancora generare
alcun nodo Node-RED reale.

## Implementazione richiesta

1. Definisci System Automation Graph con endpoint `Core record field`, `Core command`,
   Node-RED processing/integration e stato connection; usa device ID + stable key +
   schema/field/command, mai runtime ID.
2. Implementa catalogo unificato dei Core disponibili e compatibility engine per tipi,
   unità e comando. Un link temperatura→display deve dichiarare trasformazione quando
   gli schemi differiscono.

## Verifiche

- un endpoint del grafo referenzia sempre device ID + stable key, mai un ID di
  sessione effimero;
- un link fra schemi con unità incompatibili richiede una trasformazione esplicita,
  non converte implicitamente;
- un catalog change su un Core coinvolto rende stale i link finché non vengono
  rivalidati.

## Fine task

- [ ] Il System Automation Graph rappresenta ogni collegamento cross-Core previsto.
- [ ] Nessun link può referenziare stato effimero non stabile fra riconnessioni.

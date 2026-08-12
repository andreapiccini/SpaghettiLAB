# S041 — Normalizzazione catalogo e topologia

**Stato:** ⬜ TODO
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

- [ ] Catalogo e topologia normalizzati sono indipendenti dall'ordine di lettura.
- [ ] Nessun GPIO o tipo concreto è hardcoded nella normalizzazione.

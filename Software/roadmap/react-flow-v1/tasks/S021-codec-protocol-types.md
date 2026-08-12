# S021 — Codec e tipi Protocol V1

**Stato:** ⬜ TODO
**Dipende da:** S014

## Obiettivo

Rappresentare senza perdita, in TypeScript, tutti i tipi e la serializzazione del
Protocol V1 firmware.

## Implementazione richiesta

1. Implementa codec CBOR e tipi Protocol V1 da golden vector firmware: envelope,
   status, Config, catalogo, valori, record, job, topology, resources e manifest.
2. Mantieni INT64/UINT64 come `bigint`; converti in JSON con la regola lossless del
   firmware e rifiuta numeri non rappresentabili.

## Verifiche

- stessi golden vector superano round-trip identico in TypeScript e firmware;
- INT64/UINT64 ai limiti di range non perdono precisione andata/ritorno;
- un numero JSON non rappresentabile losslessly viene rifiutato, non arrotondato.

## Fine task

- [ ] Ogni tipo del Protocol V1 necessario alla V1 ha codec testato su golden vector.
- [ ] Nessuna perdita di precisione sui tipi a 64 bit.

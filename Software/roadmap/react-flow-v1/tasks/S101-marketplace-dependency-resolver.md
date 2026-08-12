# S101 — Marketplace catalog e dependency resolver

**Stato:** ⬜ TODO
**Dipende da:** S063, S080

## Obiettivo

Sapere quali Capability Pack esistono, cosa richiedono e se possono coesistere, prima
di proporre qualunque installazione.

## Implementazione richiesta

1. Implementa provider marketplace V1 da indice locale o HTTPS firmato. Il modello
   contiene pack ID/versione, dipendenze/conflitti, artifact, hash, firma/trust,
   Core/profile/layout, ABI/Protocol/Config, tipi forniti e resource manifest.
2. Mantieni separati marketplace available catalog, Core installed feature catalog e
   Project required artifacts.
3. Implementa dependency resolver deterministico con motivazione per ogni selezione,
   conflitto o incompatibilità; nessuna dipendenza implicita scaricata dopo conferma.

## Verifiche

- un Block Kalman assente risolve al pack/artifact corretto con motivazione esplicita;
- un pack Modbus con dipendenza incompatibile fallisce la risoluzione prima di
  qualunque trasferimento;
- available catalog, installed feature catalog e required artifacts restano
  distinguibili in ogni stato.

## Fine task

- [ ] Il marketplace funzionale copre discovery e resolution dei pack.
- [ ] Il resolver è deterministico e motiva ogni esito.

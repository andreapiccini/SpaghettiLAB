# S061 — Modello authoring ed editor istruzioni

**Stato:** ⬜ TODO
**Dipende da:** S043; integrabile con S050

## Obiettivo

Permettere di descrivere completamente un sensore/attuatore compatibile con gli opcode
già installati, senza ancora occuparsi di import/export o installazione.

## Implementazione richiesta

1. Implementa modello authoring completo per metadata, transport, capability/elettrico,
   identity probe, init, sample, event, command, safe-stop e output schema.
2. Fornisci editor funzionale delle istruzioni catalogate: transazioni I2C/SPI/UART,
   GPIO/ADC, wait bounded, byte operations, mask/shift/sign, CRC ed emit.
3. Gestisci fixed-point, endian, signedness, unità, field ID e versionamento schema
   senza formule JavaScript arbitrarie.

## Verifiche

- si possono creare due sensori con mappe registri diverse sullo stesso driver
  dichiarativo;
- un profilo con init, polling ready, CRC e più output si costruisce interamente
  nell'editor;
- loop, timeout, buffer, schema o field duplicato sono rifiutati con path preciso
  nell'errore.

## Fine task

- [ ] Un profilo può essere descritto interamente senza codice host/Core arbitrario.
- [ ] I vincoli elettrici derivano dalla Bay (S050), non dal testo del profilo.

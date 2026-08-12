# S060 — Device Profile Studio

**Stato:** ⬜ TODO
**Dipende da:** S040; integrabile con S050

## Obiettivo

Consentire di aggiungere un sensore o attuatore descrivibile con opcode già installati,
senza libreria specifica e senza aggiornamento firmware.

## Implementazione richiesta

1. Implementa modello authoring completo per metadata, transport, capability/elettrico,
   identity probe, init, sample, event, command, safe-stop e output schema.
2. Fornisci editor funzionale delle istruzioni catalogate: transazioni I2C/SPI/UART,
   GPIO/ADC, wait bounded, byte operations, mask/shift/sign, CRC ed emit.
3. Calcola localmente worst-case operation count, byte, timeout, temporanei e output;
   confronta con limiti Core prima della validate remota.
4. Gestisci fixed-point, endian, signedness, unità, field ID e versionamento schema senza
   formule JavaScript arbitrarie.
5. Implementa import/export del package profilo canonico con ID, versione, hash,
   autore, compatibilità e dipendenze opcode; non eseguire contenuto importato.
6. Implementa resolver `READY/PROFILE_INSTALL_REQUIRED/FIRMWARE_UPDATE_REQUIRED/
   HARDWARE_INCOMPATIBLE/RESOURCE_INCOMPATIBLE/VERSION_CONFLICT`.
7. Implementa validate remota, installazione atomica, verifica hash post-install e
   rimozione; impedisci rimozione/sostituzione quando Config live o progetto lo usa.
8. Dopo installazione aggiorna catalogo e permette di istanziare il profilo come Module
   con address/Bay/label/calibrazione specifici.
9. Supporta profili built-in, locali e da marketplace index con stessa semantica.

## Verifiche

- crea due sensori con mappe registri diverse sullo stesso driver dichiarativo;
- profilo con init, polling ready, CRC e più output supera round-trip;
- opcode assente propone Capability Pack e non tenta installazione dati;
- loop/timeout/buffer/schema/field duplicato sono rifiutati con path preciso;
- install interrotto non cambia il catalogo e profilo in uso non viene rimosso.

## Fine task

- [ ] Un dispositivo compatibile viene aggiunto end-to-end senza sorgenti o OTA.
- [ ] Profili non possono contenere codice host/Core arbitrario.
- [ ] Revisione/hash impediscono cambiamenti silenziosi.
- [ ] Vincoli elettrici derivano dalla Bay, non dal testo del profilo.


# S050 — Composizione fisica e configurazione Module

**Stato:** ⬜ TODO
**Dipende da:** S043

## Obiettivo

Rappresentare e validare backbone, Power, Core, Bay, Connector e dispositivo esterno,
producendo istanze Module coerenti con l'hardware reale.

## Implementazione richiesta

1. Definisci entità authoring per Backbone, Power source, Core, Function Bay,
   Connector, external device e cablaggio; associa label e grouping senza alterare
   identità firmware.
2. Costruisci la composizione soltanto dalle Flow/Bay/rail dichiarate dal Core; gestisci
   backbone compatte, DIN o future varianti come metadata/proprietà catalogate, non
   come assunzioni elettriche.
3. Configura Module key stabile, driver/profile, Port, Bay, power rail, endpoint,
   indirizzo, chip-select, modalità elettrica e proprietà schema-driven.
4. Permetti uno o più Module per Port quando endpoint/transport lo consentono e mostra
   collisioni prima del deploy.
5. Modella Connector separato dalla Bay: connettore/pinout e sensore esterno possono
   cambiare senza trasformare automaticamente l'interfaccia elettrica.
6. Supporta composizioni input-only, output-only e complete; lo stesso formato fisico
   non implica reversibilità elettrica.
7. Integra discovery candidate: preview, confidence/authority, confronto, accettazione
   con key/Bay/rail scelta e rifiuto senza side effect.
8. Implementa label e raggruppamento logico “sensore” che unisce external device,
   Connector, Bay, Module e canali prodotti.

## Verifiche

- due Module I2C sulla stessa Port con indirizzi distinti sono validi;
- collisione endpoint, Bay inesistente, rail incompatibile e transport errato falliscono;
- power passivo resta `UNVERIFIED` e richiede acknowledgement dove previsto;
- cambiare label/posizione non cambia Config hash;
- accettare discovery produce un diff esplicito e non applica automaticamente.

## Fine task

- [ ] Ogni elemento fisico discusso è rappresentabile.
- [ ] Connector, Bay, Module e dispositivo esterno restano distinti.
- [ ] Config Module nasce senza hardcode di board o sensore.
- [ ] Vincoli elettrici/topologici sono verificati prima dell'I/O.


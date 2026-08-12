# S130 — Chiusura React Flow V1 end-to-end

**Stato:** ⬜ TODO
**Dipende da:** S011, S012, S013, S014, S021, S022, S023, S024, S030, S041, S042, S043,
S050, S061, S062, S063, S071, S072, S073, S080, S091, S092, S093, S094, S101, S102,
S103, S111, S112, S113, S121, S122, S123, S124

## Obiettivo

Dimostrare che l'applicazione implementa integralmente l'architettura e può essere
rilasciata come prima versione funzionale, indipendentemente dal design visuale.

## Scenario obbligatorio

Esegui da workspace pulito con due fake Core, Node-RED fake/reale e almeno un Core
fisico quando disponibile:

1. crea/importa Project e connection profile senza esportare credenziali;
2. collega Core A e B, sincronizza catalogo/topologia/Config/features/resources;
3. compone per A Power, Backbone, Bay I2C, Connector e sensore temperatura esterno;
4. crea un Device Profile con init/read/CRC/output e lo installa senza OTA;
5. istanzia profilo, schedule e pipeline scale→filter→publish;
6. rileva Kalman assente, risolve pack e completa OTA firmato con postflight;
7. sostituisce filtro col Kalman e applica Config con validate/CAS/read-back;
8. su B configura display/uscita e applica il relativo Config;
9. collega temperatura A al display B nel System Automation Graph e deploya Node-RED;
10. osserva record end-to-end, unità, boot ID, sequence e command result;
11. provoca drop, Core offline, Node-RED offline e reconnect senza perdere stato locale;
12. provoca Config concorrente e risolve senza last-write-wins;
13. provoca OTA trial failure e verifica rollback/config/profile preservati;
14. legge flash/RAM/stack/pool/workspace current/peak e allocation failure;
15. esegue discovery, comando manuale, connectivity lease e job con permission;
16. esporta/reimporta Project su storage pulito e riconcilia entrambi i Core;
17. aggiorna catalogo con un tipo fake mai hardcoded e lo usa senza patch UI;
18. verifica che flow Node-RED estranei siano rimasti invariati;
19. esegue recovery da device ID mismatch e Config assente senza azioni distruttive
    implicite;
20. produce report finale con versioni, hash, deployment e zero segreti.

## Suite e gate

- unit test Domain/Compiler/Resolver/Store;
- golden vector Protocol/Project/Profile/Config;
- component test adapter React Flow senza snapshot grafici obbligatori;
- contract test MQTT/WebSocket/Node-RED;
- integration test fake Core multi-session;
- end-to-end browser dello scenario completo;
- fuzz/property test per import, codec, graph e profile;
- fault injection reconnect, response loss, stale generation, OTA e storage;
- accessibility funzionale per ogni operazione anche senza drag-and-drop;
- bundle/dependency/security audit e build riproducibile.

## Documentazione di rilascio

Completa manuale utente funzionale, guida Device Profile, gestione pack/OTA,
diagnostica, Node-RED, backup/recovery, error catalog e matrice capability. Ogni funzione
deve indicare prerequisiti, risultato, fallimenti e recovery; nessuna voce “future
work” può riguardare i criteri V1 dell'architettura.

## Fine task

- [ ] Tutte le checklist S011–S124, S030, S050 e S080 sono complete.
- [ ] I venti passi obbligatori passano e hanno evidenza riproducibile.
- [ ] Nuovi tipi catalogati non richiedono patch UI centrali.
- [ ] Nessuna funzione dell'architettura è lasciata da implementare.
- [ ] Limiti dipendenti da hardware assente sono dichiarati come capability, non TODO software.
- [ ] Il report finale contiene zero failure e zero segreti.


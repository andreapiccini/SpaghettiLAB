# S020 — Protocol SDK e trasporti

**Stato:** ⬜ TODO
**Dipende da:** S010

## Obiettivo

Implementare una sola API host lossless per ogni operazione firmware, indipendente dal
trasporto usato dall'applicazione.

## Implementazione richiesta

1. Implementa codec CBOR e tipi Protocol V1 da golden vector firmware: envelope,
   status, Config, catalogo, valori, record, job, topology, resources e manifest.
2. Mantieni INT64/UINT64 come `bigint`; converti in JSON con la regola lossless del
   firmware e rifiuta numeri non rappresentabili.
3. Implementa `SpaghettiClient` con correlation ID, timeout complessivo, replay-aware
   retry, cancellation, paginazione coerente e mapping degli errori pubblici.
4. Implementa adapter almeno per MQTT e WebSocket/BLE gateway. Definisci interfacce per
   USB/WebSerial o trasporto locale senza duplicare semantica.
5. Implementa stream eventi con backpressure, unsubscribe, reconnect e segnalazione di
   gap tramite boot ID, sequence e drop counter.
6. Implementa tutte le operazioni: catalog/status/topology/config, validate/apply,
   discovery, command, connectivity/maintenance, audit/job, profiles, features,
   resources e update.
7. Mantieni credenziali fuori dagli URL, log ed errori; l'adapter riceve handle dal
   credential store.
8. Pubblica fixture fake deterministiche per testare app senza Core fisico.

## Verifiche

- stessi golden vector in TypeScript e firmware;
- retry non duplica mutazioni e correlation conflict è visibile;
- catalog pagination che cambia fingerprint riparte da zero;
- reboot durante request/job impedisce replay automatico pericoloso;
- MQTT e WebSocket producono gli stessi oggetti dominio;
- payload malformato, extra key, overflow e timeout sono coperti.

## Fine task

- [ ] Ogni operazione firmware necessaria alla V1 è raggiungibile dallo SDK.
- [ ] Trasporti non contengono logica Config o catalogo.
- [ ] Streaming e perdita dati sono espliciti.
- [ ] Fixture e contract test non richiedono rete reale.


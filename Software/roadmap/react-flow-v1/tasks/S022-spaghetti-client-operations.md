# S022 — SpaghettiClient e operazioni firmware

**Stato:** ⬜ TODO
**Dipende da:** S021

## Obiettivo

Fornire un client host unico, indipendente dal trasporto, che copre ogni operazione
firmware necessaria alla V1.

## Implementazione richiesta

1. Implementa `SpaghettiClient` con correlation ID, timeout complessivo, replay-aware
   retry, cancellation, paginazione coerente e mapping degli errori pubblici.
2. Implementa tutte le operazioni: catalog/status/topology/config, validate/apply,
   discovery, command, connectivity/maintenance, audit/job, profiles, features,
   resources e update.
3. Mantieni credenziali fuori dagli URL, log ed errori; l'adapter riceve handle dal
   credential store.

## Verifiche

- retry non duplica mutazioni e un correlation conflict è visibile al chiamante;
- catalog pagination che cambia fingerprint a metà lettura riparte da zero;
- reboot durante request/job impedisce replay automatico pericoloso;
- payload malformato, extra key, overflow e timeout sono coperti da test;
- nessuna credenziale compare in log, errori o stringhe URL costruite dal client.

## Fine task

- [ ] Ogni operazione firmware necessaria alla V1 è raggiungibile dallo SDK.
- [ ] Retry, correlation e paginazione sono corretti sotto fault injection.

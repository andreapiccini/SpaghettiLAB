# S093 — Stato, health e resource monitor

**Stato:** ⬜ TODO
**Dipende da:** S091

## Obiettivo

Rendere leggibile lo stato interno del Core e l'uso reale delle sue risorse, con il
significato che ha per il firmware, non un riassunto generico.

## Implementazione richiesta

1. Implementa status per Module, schedule, Rule, Block, service, connectivity, health,
   reset cause, watchdog, audit e job.
2. Implementa resource monitor: flash/image headroom, RAM statica, pool/workspace/
   stack capacity-current-peak, allocation failures e limiti Config. Non mostrare una
   generica "RAM installabile".

## Verifiche

- il resource high-water aumenta correttamente e un reset diagnostico richiede
  autorizzazione esplicita;
- flash headroom, RAM statica e pool/stack sono mostrati come grandezze distinte, mai
  sommate in un unico numero fuorviante;
- una allocation failure passata è visibile anche dopo che la condizione è rientrata.

## Fine task

- [ ] Ogni stato/diagnostica firmware previsto dalla V1 è leggibile.
- [ ] La diagnostica risorse rispetta esattamente il significato dato dal firmware.

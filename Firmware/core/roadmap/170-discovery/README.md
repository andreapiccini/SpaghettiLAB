# Fase 170 — Discovery

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Tradurre risultati di discovery in assegnazioni accettate dal Module Manager.

## Dipende da

[Fase 160 — MQTT](../160-mqtt/README.md)

## Risultato visibile

Un provider manuale configura un modulo senza entrare nel Manager.

## Task

1. ⬜ [TASK-170-01 — Definire i tipi risultato di Discovery](TASK-170-01-define-discovery-result-types.md)
2. ⬜ [TASK-170-02 — Definire l’API del provider Discovery](TASK-170-02-define-the-discovery-provider-api.md)
3. ⬜ [TASK-170-03 — Implementare la validazione di Discovery manuale](TASK-170-03-implement-manual-discovery-validation.md)
4. ⬜ [TASK-170-04 — Inviare i risultati accettati al Module Manager](TASK-170-04-route-accepted-results-to-module-manager.md)
5. ⬜ [TASK-170-05 — Instradare le assegnazioni Config tramite Discovery](TASK-170-05-route-config-assignments-through-discovery.md)

## Criteri di completamento della fase

- [ ] Tipi risultato e ownership sono espliciti.
- [ ] Il provider non modifica direttamente lo stato del Manager.
- [ ] Risultati invalidi o duplicati vengono rifiutati.

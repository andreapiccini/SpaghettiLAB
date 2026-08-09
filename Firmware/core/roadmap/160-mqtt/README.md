# Fase 160 — MQTT

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Aggiungere MQTT come consumer opzionale dei dati, senza spostare responsabilità di dominio.

## Dipende da

[Fase 150 — CBOR](../150-cbor/README.md)

## Risultato visibile

Un campione temperatura raggiunge un topic MQTT configurato.

## Task

1. ⬜ [TASK-160-01 — Scegliere il percorso di rete per lo sviluppo](TASK-160-01-choose-the-development-network-path.md)
2. ⬜ [TASK-160-02 — Abilitare la configurazione di rete minima](TASK-160-02-enable-the-minimum-network-kconfig.md)
3. ⬜ [TASK-160-03 — Implementare la segnalazione di rete pronta](TASK-160-03-implement-network-readiness-signalling.md)
4. ⬜ [TASK-160-04 — Definire l’API del servizio MQTT](TASK-160-04-define-the-mqtt-service-api.md)
5. ⬜ [TASK-160-05 — Implementare worker MQTT e stato del client](TASK-160-05-implement-the-mqtt-worker-and-client-state.md)
6. ⬜ [TASK-160-06 — Accodare la temperatura per un topic di sviluppo](TASK-160-06-queue-temperature-for-a-fixed-development-topic.md)
7. ⬜ [TASK-160-07 — Integrare e provare MQTT con topic fisso](TASK-160-07-integrate-and-test-fixed-topic-mqtt.md)
8. ⬜ [TASK-160-08 — Spostare le impostazioni MQTT in Config](TASK-160-08-move-mqtt-settings-into-config.md)

## Criteri di completamento della fase

- [ ] Percorso di rete e credenziali di sviluppo sono scelti esplicitamente.
- [ ] Callback di rete non eseguono lavoro bloccante.
- [ ] Coda, reconnessione e stato client hanno limiti definiti.

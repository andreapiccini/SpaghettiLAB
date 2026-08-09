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

1. ⬜ [TASK-160-01 — Pubblicare i dati con MQTT](TASK-160-01-pubblicare-i-dati-con-mqtt.md)

## Criteri di completamento della fase

- [ ] Percorso di rete e credenziali di sviluppo sono scelti esplicitamente.
- [ ] Callback di rete non eseguono lavoro bloccante.
- [ ] Coda, reconnessione e stato client hanno limiti definiti.

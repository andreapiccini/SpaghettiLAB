# Fase 390 — Finalizzazione piattaforma V1

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Dimostrare con fake, test e build che le estensioni non richiedono modifiche centrali e
congelare il contratto usato da Node-RED.

## Task

1. ⬜ [TASK-390-01 — Chiudere e qualificare la piattaforma V1](TASK-390-01-chiudere-e-qualificare-la-piattaforma-v1.md)

## Criteri di completamento della fase

- [ ] Driver, Device Profile, Block, regola e provider fake sono estensioni esterne.
- [ ] Protocollo e compatibilità sono congelati come V1.
- [ ] Il gate Node-RED MQTT e BLE/gateway del piano V1 è completamente superato.
- [ ] SDK, golden vector, concorrenza Config e fuzzing chiudono il contratto host.
- [ ] Health Supervisor e watchdog vengono qualificati per capability reale.
- [ ] Ogni profilo supera budget RAM, lifecycle e failure test.
- [ ] Build differenziali decidono con misure fra immagine universale e Capability Pack opzionali.

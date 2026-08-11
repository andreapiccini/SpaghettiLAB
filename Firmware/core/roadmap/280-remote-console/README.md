# Fase 280 — Console remota

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Usare lo stesso monitor gradevole via USB o rete senza esporre una Telnet non protetta.

## Task

1. ⬜ [TASK-280-01 — Rendere make monitor multi-trasporto](TASK-280-01-rendere-monitor-multi-trasporto.md)

## Criteri di completamento della fase

- [ ] `make monitor` seleziona USB oppure rete esplicitamente.
- [ ] Il canale remoto è cifrato, autenticato e disabilitabile.
- [ ] Comandi e log mantengono framing e formattazione.
- [ ] Una sessione lenta non blocca Runtime o Communication.

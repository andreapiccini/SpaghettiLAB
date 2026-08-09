# Fase 130 — Relay + Runtime V1

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Aggiungere un attuatore Relay e una regola di soglia deterministica.

## Dipende da

[Fase 120 — Runtime V0](../120-runtime-v0/README.md)

## Risultato visibile

Una temperatura sopra 25 °C comanda il Relay configurato.

## Task

1. ⬜ [TASK-130-01 — Aggiungere Relay e la regola di soglia](TASK-130-01-aggiungere-relay-e-regola-di-soglia.md)

## Criteri di completamento della fase

- [ ] Il Relay parte e termina nello stato sicuro.
- [ ] I comandi passano dal Module Manager.
- [ ] La regola usa isteresi o comportamento al limite documentato.

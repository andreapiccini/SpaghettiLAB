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

1. ⬜ [TASK-130-01 — Definire il contratto dei comandi Relay](TASK-130-01-define-the-relay-command-contract.md)
2. ⬜ [TASK-130-02 — Implementare ciclo di vita e comando sicuro del Relay](TASK-130-02-implement-safe-relay-lifecycle-and-set.md)
3. ⬜ [TASK-130-03 — Registrare e compilare il driver Relay](TASK-130-03-register-and-build-the-relay-driver.md)
4. ⬜ [TASK-130-04 — Instradare i comandi tramite Module Manager](TASK-130-04-route-commands-through-module-manager.md)
5. ⬜ [TASK-130-05 — Definire una regola di soglia](TASK-130-05-define-one-threshold-rule.md)
6. ⬜ [TASK-130-06 — Valutare la temperatura nel thread Runtime](TASK-130-06-evaluate-temperature-in-the-runtime-thread.md)
7. ⬜ [TASK-130-07 — Provare soglia e stato sicuro del Relay](TASK-130-07-test-the-relay-threshold-and-safe-state.md)

## Criteri di completamento della fase

- [ ] Il Relay parte e termina nello stato sicuro.
- [ ] I comandi passano dal Module Manager.
- [ ] La regola usa isteresi o comportamento al limite documentato.

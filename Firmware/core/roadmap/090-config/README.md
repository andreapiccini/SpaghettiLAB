# Fase 090 — Config interna

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Definire, validare e applicare la più piccola configurazione interna del prodotto.

## Dipende da

[Fase 080 — SHT40 rimovibile a runtime](../080-runtime-removable-sht40/README.md)

## Risultato visibile

Una Config C assegna Port 0, SHT40 e il periodo di campionamento.

## Task

1. ⬜ [TASK-090-01 — Definire il modello interno di Config](TASK-090-01-define-the-internal-config-model.md)
2. ⬜ [TASK-090-02 — Rendere esplicita la proprietà delle stringhe Config](TASK-090-02-make-config-string-ownership-explicit.md)
3. ⬜ [TASK-090-03 — Implementare la validazione di Config](TASK-090-03-implement-config-validation.md)
4. ⬜ [TASK-090-04 — Implementare l’applicazione di Config](TASK-090-04-implement-config-apply.md)
5. ⬜ [TASK-090-05 — Aggiungere e applicare una Config C statica](TASK-090-05-add-and-apply-one-hardcoded-c-config.md)
6. ⬜ [TASK-090-06 — Provare validazione e applicazione di Config](TASK-090-06-test-config-validation-and-apply.md)

## Criteri di completamento della fase

- [ ] Proprietà e durata delle stringhe sono esplicite.
- [ ] La validazione non modifica lo stato.
- [ ] L’applicazione usa API pubbliche e gestisce rollback.

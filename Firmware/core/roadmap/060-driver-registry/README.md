# Fase 060 — Driver Registry

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Associare un nome di tipo stabile al descrittore del relativo Module Driver.

## Dipende da

[Fase 050 — Module + Module Driver](../050-module-driver/README.md)

## Risultato visibile

La ricerca di `sht40` riesce; un tipo sconosciuto viene rifiutato.

## Task

1. ⬜ [TASK-060-01 — Dichiarare l’API di Driver Registry](TASK-060-01-declare-the-driver-registry-api.md)
2. ⬜ [TASK-060-02 — Implementare la tabella statica dei driver](TASK-060-02-implement-the-fixed-driver-table.md)
3. ⬜ [TASK-060-03 — Convalidare le voci del registry](TASK-060-03-validate-registry-entries.md)
4. ⬜ [TASK-060-04 — Inizializzare Driver Registry da Core](TASK-060-04-initialize-the-registry-from-core.md)
5. ⬜ [TASK-060-05 — Provare la ricerca di driver noti e sconosciuti](TASK-060-05-test-known-and-unknown-driver-lookup.md)

## Criteri di completamento della fase

- [ ] La tabella driver è fissa e validata all’avvio.
- [ ] Nomi duplicati o descrittori incompleti vengono rifiutati.
- [ ] Core inizializza il registry prima di usarlo.

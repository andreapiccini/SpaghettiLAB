# Fase 392 — Esporre flash headroom e RAM statica su `GET_RESOURCES`

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Far arrivare sul wire `GET_RESOURCES` (op 21) i campi di `struct
spaghetti_resources_snapshot` che oggi esistono solo lato C: `flash_slot_bytes`,
`flash_image_budget_bytes`, `flash_headroom_bytes`, `static_ram_budget_bytes`
(`Firmware/core/include/spaghetti/resources.h:45-70`, popolati da
`spaghetti_image_manifest_get()` in `resources.c:172-178`, a loro volta da Kconfig via
`Firmware/core/subsys/feature_registry/image_manifest.c:320-328`).

## Perché è una fase separata

Scoperto durante l'implementazione lato Software di S093
(`Software/roadmap/react-flow-v1/tasks/S093-status-health-resources.md`), che richiede
di mostrare flash/image headroom e RAM statica come grandezze distinte dai pool
capacity/used/peak — mai sommate in un unico numero fuorviante.
`execute_get_resources` (`subsys/communication/operations/resources_ops.c:36-72`)
oggi encoda solo 8 chiavi: `feature_set_hash` (0), i sei `ResourcePool`
modules/rules/blocks/profiles/records/workspace (1-6) e `allocation_failures` (7).
I campi flash/RAM del C struct non vengono mai serializzati: esistono nel firmware ma
non attraversano il wire.

Non blocca nulla oggi: `@spaghettilab/core-status` (lato Software, S093) tratta questi
campi come assenti e li mostra esplicitamente come "non esposti dal firmware" invece di
inventare un valore o ometterli silenziosamente. Ma resta un buco funzionale
non tracciato altrove.

## Task

1. ⬜ Aggiungere a `execute_get_resources` le chiavi CBOR 8-11 (o successive libere) per
   `flash_slot_bytes`, `flash_image_budget_bytes`, `flash_headroom_bytes`,
   `static_ram_budget_bytes` — stesso stile `uint32` dei campi esistenti.
2. ⬜ Aggiornare `protocol.h`/documentazione del wire V1 con le nuove chiavi.
3. ⬜ `@spaghettilab/protocol-sdk`'s `GetResourcesResponse` (lato Software) e
   `@spaghettilab/core-status`'s resource monitor vanno aggiornati per leggere i nuovi
   campi invece di mostrarli come assenti.

## Criteri di completamento della fase

- [ ] `GET_RESOURCES` espone flash headroom e RAM statica come campi distinti, separati
      dai `ResourcePool` esistenti.
- [ ] `@spaghettilab/core-status`'s README rimuove la nota "gap firmware" una volta
      chiusa questa fase.

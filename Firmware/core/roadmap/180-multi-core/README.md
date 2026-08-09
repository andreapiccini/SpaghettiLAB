# Fase 180 — Varianti Core multiple

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Spostare i dati fisici Port nelle board reali e mantenere indipendenti i livelli superiori.

## Dipende da

[Fase 170 — Discovery](../170-discovery/README.md)

## Risultato visibile

Lo stesso firmware applicativo viene compilato per due varianti Core.

## Task

1. ⬜ [TASK-180-01 — Definire il binding Spaghetti Port](TASK-180-01-define-the-spaghetti-port-binding.md)
2. ⬜ [TASK-180-02 — Convalidare il binding di Port](TASK-180-02-validate-the-port-binding.md)
3. ⬜ [TASK-180-03 — Creare la prima definizione board Spaghetti LAB](TASK-180-03-create-the-first-real-spaghetti-board-skeleton.md)
4. ⬜ [TASK-180-04 — Spostare i dati hardware verificati nel DTS della board](TASK-180-04-move-verified-hardware-facts-into-board-dts.md)
5. ⬜ [TASK-180-05 — Enumerare i Port dal Devicetree](TASK-180-05-enumerate-devicetree-ports.md)
6. ⬜ [TASK-180-06 — Compilare e provare la prima board Core reale](TASK-180-06-build-and-test-the-first-real-core-board.md)
7. ⬜ [TASK-180-07 — Compilare una seconda variante Core](TASK-180-07-build-a-second-core-variant.md)

## Criteri di completamento della fase

- [ ] Binding e board definition rispettano gli schemi Zephyr.
- [ ] Il catalogo Port deriva dal Devicetree.
- [ ] Il codice comune non contiene rami basati sul nome della board.

# S043 — Adapter React Flow

**Stato:** ⬜ TODO
**Dipende da:** S042

## Obiettivo

Collegare l'`EditorModel` alla superficie React Flow senza che React Flow diventi mai
fonte autorevole di dati di dominio.

## Implementazione richiesta

1. Implementa adapter bidirezionale Domain↔React Flow. Gli eventi React Flow diventano
   command di dominio (da S014); node/edge React Flow non diventano fonte autorevole.
2. Assicura che un catalogo fake aggiunga un nuovo tipo senza modificare sorgenti UI.

## Verifiche

- un test con catalogo fake introduce un nuovo Module/Block senza toccare switch o
  componenti concreti nell'adapter;
- lo stato React Flow (posizione, selezione, viewport) resta metadata locale e non
  altera l'esito della validazione di dominio.

## Fine task

- [ ] React Flow adapter non contiene protocollo o validazione firmware.
- [ ] Un tipo nuovo dal catalogo appare nell'editor senza patch al codice dell'adapter.

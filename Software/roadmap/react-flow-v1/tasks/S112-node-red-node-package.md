# S112 — Package nodi Node-RED SpaghettiLAB

**Stato:** ⬜ TODO
**Dipende da:** S111

## Obiettivo

Fornire i nodi Node-RED reali che il System Automation Graph potrà orchestrare,
costruiti sullo stesso SDK Protocol usato dal resto dell'applicazione.

## Implementazione richiesta

1. Implementa package di nodi Node-RED SpaghettiLAB necessario: connection/config,
   record source, command target, status e coordinator; riusa lo stesso SDK Protocol
   (S021–S024).

## Verifiche

- i nodi Node-RED e l'applicazione React Flow usano la stessa decodifica/validazione
  Protocol V1, non due implementazioni parallele;
- un nodo `record source` e un nodo `command target` funzionano contro le stesse
  fixture fake usate da S024.

## Fine task

- [ ] Il package nodi copre connection/config, record source, command target, status
      e coordinator.
- [ ] I custom node condividono SDK e semantica firmware con il resto dell'app, non
      una reimplementazione separata.

# S012 — Tipi di dominio, ID ed errori strutturati

**Stato:** ✅ DONE
**Dipende da:** S011

## Obiettivo

Definire i tipi e gli identificatori stabili di ogni entità dell'architettura, e il
formato unico con cui il dominio comunica un fallimento.

## Implementazione richiesta

1. Definisci value object e ID branded per Project, Core binding, Module, Profile,
   Schedule, Rule, Block, edge, deployment e Node-RED resource.
2. Definisci errori strutturati con codice, severity, path, target, remediation e causa;
   nessun servizio successivo restituisce soltanto stringhe.

## Verifiche

- ID duplicati e riferimenti dangling fra entità sono rifiutati a livello di tipo o
  costruzione;
- ogni tipo di errore di dominio ha codice, path e remediation popolabili nei test.

## Fine task

- [x] Tutte le entità dell'architettura hanno ownership e ID stabili.
- [x] Errori di dominio sono utilizzabili e ispezionabili senza UI.

## Implementazione (2026-08-12)

`packages/domain/src/`: `result.ts` (`Result<T,E>`, mai eccezioni per fallimenti
attesi), `errors.ts` (`DomainError` con code/severity/path/target/remediation/cause,
mai una stringa nuda), `ids.ts` (10 ID branded — Project/CoreBinding/Module/
Profile/Schedule/Rule/Block/Edge/Deployment/NodeRedResource — non mutuamente
assegnabili a livello di tipo, verificato con asserzioni `@ts-expect-error` che
`tsc -b` valuta ad ogni build), `id-registry.ts` (`IdRegistry<Id>`, rifiuta
duplicati alla registrazione e riferimenti dangling al resolve). 25 test,
100% coverage sui nuovi file. `FakeUuidGenerator` di S011 aggiornato per produrre
stringhe realmente UUID-shaped, altrimenti non avrebbe superato la validazione dei
nuovi ID branded.

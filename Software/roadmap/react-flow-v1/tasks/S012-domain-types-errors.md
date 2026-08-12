# S012 — Tipi di dominio, ID ed errori strutturati

**Stato:** ⬜ TODO
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

- [ ] Tutte le entità dell'architettura hanno ownership e ID stabili.
- [ ] Errori di dominio sono utilizzabili e ispezionabili senza UI.

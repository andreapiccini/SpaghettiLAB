# TASK-070-06 — Provare successo e rollback del Manager

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager
**Dipende da:** [TASK-070-05](TASK-070-05-integrate-manager-into-core-and-main.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Intest READY e valori.

---

## File da aprire

`subsys/module_manager/module_manager.c`, `src/main.c` e la console seriale.

---

## Cosa scrivere o modificare

Prova il percorso Port 0/SHT40 valido, un tipo sconosciuto, uno Port occupato, una
lettura ID non valida e un errore di init driver forzato. Confermare ogni configurazione
non riuscita lascia lo slot riutilizzabile.

---

## Perché

Config interna può successivamente chiamare esattamente questa API Manager.

---

## Chi usa il risultato

Test principale.

---

## Evento che attiva il codice

BOOT/PERIODIC LOOP.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Module Manager -> Registro -> driver -> sensore statico di corrente.

---

## Input

Port 0, `sht40`.

---

## Output

Intest READY e valori.

---

## Errori da gestire

Log exact configure/read errno.

---

## Non implementare ancora

- Struttura Config o CBOR

---

## Procedura

- [ ] Aprire solo `subsys/module_manager/module_manager.c`, `src/main.c` e la console
      seriale.
- [ ] Provare il percorso Port 0/SHT40 valido, un tipo sconosciuto, uno Port occupato,
      una lettura ID non valida e un errore di init driver forzato.
- [ ] Confermare ogni configurazione non riuscita lascia lo slot riutilizzabile.
- [ ] Gestisci solo questi errori realistici: Log exact configure/read errno.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Richiedi anche tipo sconosciuto e occupato Port in test controllato, quindi ripristina
il percorso valido.

---

## Risultato atteso

Manager possiede l'unica istanza del modulo, il lavoro reale legge e la configurazione
fallita torna completamente indietro.

---

## Checklist di completamento

- [ ] La documentazione o il file di implementazione richiesto è stato modificato come
      specificato
- [ ] Il tipo, la funzione, la configurazione o il test indicato esiste
- [ ] La build riesce quando il task la richiede
- [ ] La verifica specifica del task passa
- [ ] Non è stata aggiunta funzionalità estranea al task

---

## Commit suggerito

`module: test manager success and rollback`

---

## Task successivo

[TASK-080-01](../080-runtime-removable-sht40/TASK-080-01-define-the-sht40-runtime-configuration.md) — Definire la configurazione runtime di SHT40

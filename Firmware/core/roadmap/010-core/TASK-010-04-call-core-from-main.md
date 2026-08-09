# TASK-010-04 — Chiamare Core da main

**Stato:** ⬜ TODO
**Fase:** 010 — Core
**Dipende da:** [TASK-010-03](TASK-010-03-add-core-to-the-application-build.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Log Core poi uptime.

---

## File da aprire

`src/main.c`.

---

## Cosa scrivere o modificare

Includi `<spaghetti/core.h>`, chiama `spaghetti_core_init()` una volta prima del loop
uptime esistente, log/print il suo ritorno negativo e stop/return in caso di guasto.
Mantenere il loop uptime per la prova.

---

## Perché

Il confine è utile solo se esercitato.

---

## Chi usa il risultato

Zephyr invoca `main`; `main` chiama Core.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

`spaghetti_core_init()`.

---

## Input

Nessuno.

---

## Output

Log Core poi uptime.

---

## Errori da gestire

Risultato negativo.

---

## Non implementare ancora

- Sposta il ciclo in Core o avvia altri thread

---

## Procedura

- [ ] Apri solo `src/main.c`.
- [ ] Includi `<spaghetti/core.h>`, chiama `spaghetti_core_init()` una volta prima del
      loop di uptime esistente, log/print il suo ritorno negativo e stop/return in caso
      di guasto.
- [ ] Tenere il loop uptime per la prova.
- [ ] Gestire solo questi errori realistici: risultato negativo init.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

NO

---

## Verifica

Reimposta e leggi la console.

---

## Risultato atteso

`Spaghetti Core ready`, quindi comportamento in tempo reale invariato.

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

`core: call core from main`

---

## Task successivo

[Registrazione del firmware TASK-010-05](TASK-010-05-structure-firmware-logging.md) —
Structure

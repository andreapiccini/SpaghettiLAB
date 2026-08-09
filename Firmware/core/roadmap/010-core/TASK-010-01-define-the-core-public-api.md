# TASK-010-01 — Definire l’API pubblica di Core

**Stato:** ✅ DONE
**Fase:** 010 — Core
**Dipende da:** [TASK-000-02](../000-baseline/TASK-000-02-flash-and-observe-the-baseline.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Solo contratto di dichiarazione.

---

## File da aprire

`include/spaghetti/core.h`.

---

## Cosa scrivere o modificare

Aggiungere una protezione include; dichiarare `enum spaghetti_core_state {
SPAGHETTI_CORE_UNINITIALIZED, SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`, `int
spaghetti_core_init(void);`, e `enum spaghetti_core_state
spaghetti_core_get_state(void);`.

---

## Perché

L'inizializzazione di tutti i sottosistemi successivi necessita di un coordinatore.

---

## Chi usa il risultato

`src/main.c`; futuro Communication legge stato.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Principale Zephyr thread.

---

## Chiamate e dipendenze

Ancora nessun sottosistema inferiore.

---

## Input

Nessuno.

---

## Output

Solo contratto di dichiarazione.

---

## Errori da gestire

Nessuna in header; documento negativo errno convenzione.

---

## Non implementare ancora

- Opzioni di capacità, Wi-Fi/BLE, array di sottosistemi, thread

---

## Procedura

- [x] Apri solo `include/spaghetti/core.h`.
- [x] Aggiungi una protezione include
- [x] dichiarare `enum spaghetti_core_state { SPAGHETTI_CORE_UNINITIALIZED,
      SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`, `int spaghetti_core_init(void);` e
      `enum spaghetti_core_state spaghetti_core_get_state(void);`.
- [x] Gestire solo questi errori realistici: Nessuno in intestazione; documento
      convenzione errno negativo.
- [x] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [x] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

NO

---

## Flash

NO

---

## Verifica

Recensione proprietà: solo Core può modificare il suo stato.

---

## Risultato atteso

Piccola intestazione senza campo specifico.

---

## Checklist di completamento

- [x] La documentazione o il file di implementazione richiesto è stato modificato come
      specificato
- [x] Il tipo, la funzione, la configurazione o il test indicato esiste
- [x] La build riesce quando il task la richiede
- [x] La verifica specifica del task passa
- [x] Non è stata aggiunta funzionalità estranea al task

---

## Commit suggerito

`core: define the core public api`

---

## Task successivo

[TASK-010-02](TASK-010-02-implement-core-state-and-initialization.md) — Implementare stato e inizializzazione di Core

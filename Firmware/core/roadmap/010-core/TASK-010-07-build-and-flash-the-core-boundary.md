# TASK-010-07 — Compilare e provare il confine di Core

**Stato:** ⬜ TODO
**Fase:** 010 — Core
**Dipende da:** [TASK-010-06](TASK-010-06-define-component-type-and-error-conventions.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Log strutturato Core poi log strutturato uptime.

---

## File da aprire

`README.md`, `src/main.c` e la console seriale.

---

## Cosa scrivere o modificare

Non aggiungere codice. Costruisci, flash, resetta la scheda e cattura l'output di avvio
che prova l'inizializzazione di Core prima del loop temporaneo di uptime.

---

## Perché

Il limite, la politica di registrazione e le convenzioni di tipo sono complete solo dopo
che il firmware è stato osservato sulla scheda reale.

---

## Chi usa il risultato

Zephyr invoca `main`; `main` chiama Core; il log backend segnala entrambi i moduli.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CALL DIRECT e Zephyr Logging.

---

## Contesto di esecuzione

Contesto di registrazione principale thread e Zephyr.

---

## Chiamate e dipendenze

`spaghetti_core_init()` e la registrazione configurata backend.

---

## Input

Nessuno.

---

## Output

Strutturato Core prontezza seguita da uptime applicativo strutturato.

---

## Errori da gestire

Risultato negativo init, uscita seriale mancante, porta seriale errata o filtro log
inatteso.

---

## Non implementare ancora

- Spostare il ciclo in Core o avviare altri thread.
- Cambia le convenzioni di registrazione o tipo durante l'esecuzione della prova
  hardware.

---

## Procedura

- [ ] Aprire solo `README.md`, `src/main.c` e la console seriale.
- [ ] Eseguire il validatore e costruire senza cambiare la sorgente.
- [ ] Flash, resetta la scheda e cattura l'output di avvio.
- [ ] Confermare i rapporti `spaghetti_core` Pronti una volta prima del primo messaggio
      di uptime `spaghetti_app`.
- [ ] Confermare non viene visualizzata alcuna linea `printk`.
- [ ] Gestisci solo gli errori elencati in **Errors to handle**.
- [ ] Confermare nessun elemento da **Non implementare ancora** è stato aggiunto.

---

## Build

SÌ — `make build`.

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Reimpostare con il monitor seriale aperto. Confermare ogni linea contiene le
informazioni previste Zephyr module/level e che Core pronta appare una volta prima
dell'uscita di uptime.

---

## Risultato atteso

La scheda avvia attraverso Core, segnala diagnostica di avvio strutturata, e conserva il
comportamento temporaneo di uptime.

---

## Checklist di completamento

- [ ] Validatore e compilazione completa.
- [ ] Il firmware è lampeggiato sulla scheda prevista.
- [ ] La prontezza Core appare una volta prima dell'uptime.
- [ ] App e modulo Core names/severities sono visibili e corretti.
- [ ] Non è stata aggiunta alcuna stampa raw di proprietà di progetto o funzionalità non
      correlate.

---

## Commit suggerito

`core: build and flash the structured core boundary`

---

## Task successivo

[TASK-020-01](../020-board-i2c/TASK-020-01-verify-the-real-i2c-controller-and-pins.md) — Verificare controller e pin I2C reali

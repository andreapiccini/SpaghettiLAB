# TASK-120-04 — Implementare caricamento, avvio e arresto di Runtime

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0
**Dipende da:** [TASK-120-03](TASK-120-03-implement-the-runtime-sampling-thread.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un evento campione per periodo.

---

## File da aprire

`subsys/runtime/runtime.c`.

---

## Cosa scrivere o modificare

Implementare la convalida e lo stato per init/load/start/stop. Rifiutare il periodo
zero, il modulo non valido, il doppio avvio e l'arresto prima dell'avvio. Avviare e
interrompere il servizio Timer senza lavorare nella callback timer.

---

## Perché

Il ciclo manuale ha dimostrato tutti gli strati inferiori.

---

## Chi usa il risultato

Core/Config inizia; Zephyr timer sveglia Runtime.

---

## Evento che attiva il codice

Runtime timer.

---

## Meccanismo di invocazione

K_TIMER -> K_SEM -> THREAD -> DIRECT CALL.

---

## Contesto di esecuzione

La scadenza del tempo dà semaforo; Runtime thread fa I/O.

---

## Chiamate e dipendenze

Kernel timer/semaphore/thread, Manager read, Data publish.

---

## Input

task carico.

---

## Output

Un evento campione per periodo.

---

## Errori da gestire

Missed/coalesced tick è osservabile con semaforo max=1; read/publish fallimento;
attività non valida all'avvio.

---

## Non implementare ancora

- zbus-driven scheduler, più timer, dinamica thread

---

## Procedura

- [ ] Apri solo `subsys/runtime/runtime.c`.
- [ ] Implementa la validazione e lo stato per init/load/start/stop.
- [ ] Rifiuta il periodo zero, il modulo non valido, il doppio avvio e l'arresto prima
      dell'avvio.
- [ ] Avviare e interrompere il servizio Timer senza lavorare nel callback timer.
- [ ] Gestire solo questi errori realistici: Missed/coalesced tick è osservabile con
      semaphore max=1; read/publish fallimento; attività non valida all'avvio.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

NO

---

## Flash

NO

---

## Verifica

Falso contatore Manager prima del test hardware.

---

## Risultato atteso

Timer callback contiene nessuna chiamata di blocco.

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

`runtime: implement runtime load start and stop`

---

## Task successivo

[TASK-120-05](TASK-120-05-integrate-runtime-with-core-and-config.md) — Integrare Runtime con Core e Config

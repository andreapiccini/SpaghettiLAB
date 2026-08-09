# TASK-120-02 — Implementare timer e semaforo del periodo

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0
**Dipende da:** [TASK-120-01](TASK-120-01-define-the-runtime-sampling-task-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un evento campione per periodo.

---

## File da aprire

Crea `subsys/services/timer/timer.h` e `subsys/services/timer/timer.c`.

---

## Orientamento Zephyr — k_timer e k_sem

1. **Cos’è:** `k_timer` genera una scadenza periodica; `k_sem` è un semaforo che trasferisce il segnale a un thread autorizzato a bloccare ed eseguire I/O.
2. **A cosa serve:** La callback del timer resta breve e il lavoro I2C viene eseguito fuori dal contesto di scadenza.
3. **Quando viene usato:** Il timer chiama la callback alla scadenza; la callback esegue `k_sem_give()`, mentre il thread attende con `k_sem_take()`.
4. **Build-time o runtime:** Runtime.
5. **Collegamento con questo task:** Runtime deve campionare periodicamente senza eseguire Manager o I2C dentro la callback.
6. **File reali coinvolti:** `subsys/services/timer/timer.h` e `subsys/services/timer/timer.c`.
7. **Cosa guardare nei file:** Controlla inizializzazione, periodo, start/stop, semaforo ricevuto e assenza di operazioni bloccanti nella callback.
8. **Cosa non modificare:** Non leggere sensori, non pubblicare su zbus e non chiamare Manager dalla callback di `k_timer`.

---

## Cosa scrivere o modificare

Avvolgi una `k_timer`. La sua callback di scadenza deve segnalare solo una `k_sem`
fornita con `k_sem_give()`. Implementare le chiamate init/start/stop delimitate e
mantenere la callback senza operazioni I2C, Manager e Data.

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

K_TIMER + K_SEM

---

## Contesto di esecuzione

Contesto di callback timer

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

- [ ] Aprire solo Crea `subsys/services/timer/timer.h` e
      `subsys/services/timer/timer.c`.
- [ ] Avvolgi uno `k_timer`. La sua chiamata di scadenza deve segnalare solo uno `k_sem`
      fornito con `k_sem_give()`.
- [ ] Implementare chiamate init/start/stop delimitate e mantenere la richiamata senza
      operazioni I2C, Manager e Data.
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

`runtime: implement the one-period timer service`

---

## Task successivo

[TASK-120-03](TASK-120-03-implement-the-runtime-sampling-thread.md) — Implementare il thread di campionamento Runtime

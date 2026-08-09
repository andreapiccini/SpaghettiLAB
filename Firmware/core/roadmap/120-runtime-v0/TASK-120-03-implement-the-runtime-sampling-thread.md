# TASK-120-03 — Implementare il thread di campionamento Runtime

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0
**Dipende da:** [TASK-120-02](TASK-120-02-implement-the-one-period-timer-service.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un evento campione per periodo.

---

## File da aprire

`subsys/runtime/runtime.c`.

---

## Orientamento Zephyr — thread Zephyr

1. **Cos’è:** Un thread Zephyr è un contesto schedulabile con entry function, stack e priorità espliciti.
2. **A cosa serve:** Esegue il lavoro che può attendere o bloccare, come `k_sem_take()`, lettura I2C e pubblicazione del campione.
3. **Quando viene usato:** Viene creato/avviato secondo la scelta del task e resta in attesa del semaforo tra due campionamenti.
4. **Build-time o runtime:** Runtime.
5. **Collegamento con questo task:** È il proprietario del ciclo di campionamento che prima viveva in `main`.
6. **File reali coinvolti:** `subsys/runtime/runtime.c`; eventuali dimensione stack e priorità configurabili appartengono al Kconfig del componente.
7. **Cosa guardare nei file:** Individua entry function, stack, priorità, attesa, uscita/stop e gestione degli errori.
8. **Cosa non modificare:** Non scegliere priorità casuali, non usare busy-wait e non passare al thread puntatori con durata insufficiente.

---

## Cosa scrivere o modificare

Crea un semaforo limitato e uno Runtime thread dedicato. Lo thread attende con
`k_sem_take()`, chiama direttamente Manager legge per il modulo caricato, converte il
campione e pubblica attraverso i dati. Definisci esplicitamente la dimensione dello
stack e la priorità.

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
- [ ] Crea un semaforo limitato e uno Runtime thread dedicato. Lo thread attende con
      `k_sem_take()`, chiama direttamente Manager leggere per il modulo caricato,
      converte il campione, e pubblica attraverso i dati.
- [ ] Definire esplicitamente la dimensione dello stack e la priorità.
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

`runtime: implement the runtime sampling thread`

---

## Task successivo

[TASK-120-04](TASK-120-04-implement-runtime-load-start-and-stop.md) — Implementare caricamento, avvio e arresto di Runtime

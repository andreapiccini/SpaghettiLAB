# TASK-120-01 — Definire l’API del task di campionamento Runtime

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0
**Dipende da:** [TASK-110-06](../110-data-zbus/TASK-110-06-test-zbus-fan-out-and-backpressure.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Valido caricato task/status.

---

## File da aprire

`include/spaghetti/runtime.h`.

---

## Cosa scrivere o modificare

Definire `spaghetti_runtime_sampling_task` con l'ID del modulo, i millisecondi del
periodo e il flag abilitato. Dichiarare Runtime init, caricare, avviare e interrompere
solo le funzioni; non aggiungere un linguaggio di scripting.

---

## Perché

Config contiene già un periodo di campionamento e i dati sono già distribuiti.

---

## Chi usa il risultato

Core/Config; Runtime possiede una copia dell'attività durante il caricamento.

---

## Evento che attiva il codice

BOOT/CONFIG APPLY.

---

## Meccanismo di invocazione

Chiamata diretta per il ciclo di vita.

---

## Contesto di esecuzione

Thread principale o thread chiamante.

---

## Chiamate e dipendenze

Servizio modulo Manager/Data/Timer più tardi.

---

## Input

ID modulo pronto e periodo 1000 ms.

---

## Output

Valido caricato task/status.

---

## Errori da gestire

Periodo Zero/overflow, modulo sconosciuto, già in esecuzione.

---

## Non implementare ancora

- Condizioni, azioni, grafico, bytecode, attività multiple

---

## Procedura

- [ ] Apri solo `include/spaghetti/runtime.h`.
- [ ] Definisci `spaghetti_runtime_sampling_task` con l'ID del modulo, il periodo
      millisecondi e il flag abilitato.
- [ ] Dichiara solo le funzioni Runtime init, load, start e stop
- [ ] non aggiungere una lingua di scripting.
- [ ] Gestisci solo questi errori realistici: periodo Zero/overflow, modulo sconosciuto,
      già in esecuzione.
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

Convalidate 1000; rifiutate l'ID zero e sconosciuto.

---

## Risultato atteso

Un contratto di lavoro minimo.

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

`runtime: define the runtime sampling task api`

---

## Task successivo

[TASK-120-02](TASK-120-02-implement-the-one-period-timer-service.md) — Implementare timer e semaforo del periodo

# TASK-010-02 — Implementare stato e inizializzazione di Core

**Stato:** ⬜ TODO
**Fase:** 010 — Core
**Dipende da:** [TASK-010-01](TASK-010-01-define-the-core-public-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

`0` e pronto.

---

## File da aprire

`subsys/core/core.c`.

---

## Cosa scrivere o modificare

Registra un modulo di log Zephyr. Implementa `spaghetti_core_init()` in modo da
impostare lo stato privato su `SPAGHETTI_CORE_READY`, registra `Spaghetti Core ready` e
restituisce `0`. Implementa `spaghetti_core_get_state()` come getter in sola lettura.

---

## Perché

Deve collegarsi ed eseguire prima di aggiungere dipendenze.

---

## Chi usa il risultato

`main` e diagnostica per il futuro.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Principale thread/calling thread.

---

## Chiamate e dipendenze

Solo logging Zephyr.

---

## Input

Nessuno.

---

## Output

`0` e pronto.

---

## Errori da gestire

Nessuno ancora; mantenere un percorso ERROR pronto per future dipendenze.

---

## Non implementare ancora

- Port o inizializzazione del servizio

---

## Orientamento Zephyr

La logging Zephyr fornisce livelli di log a build-time ed evita
l'output ad hoc sulla console. Questo task richiede soltanto un messaggio di log
del modulo ed un messaggio di prontezza.

---

## Procedura

- [ ] Apri solo `subsys/core/core.c`.
- [ ] Registrare un modulo di log Zephyr.
- [ ] Implementa `spaghetti_core_init()` in modo da impostare lo stato privato su
      `SPAGHETTI_CORE_READY`, registra `Spaghetti Core ready` e restituisce `0`.
- [ ] Implementa `spaghetti_core_get_state()` come getter in sola lettura.
- [ ] Gestisci solo questi errori realistici: Nessuno ancora; mantieni pronto un
      percorso ERROR per future dipendenze.
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

Ispezione statica: lo stato è privato e il getter non muta.

---

## Risultato atteso

Implementazione minima senza loop o thread.

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

`core: implement core state and initialization`

---

## Task successivo

[TASK-010-03](TASK-010-03-add-core-to-the-application-build.md) — Aggiungere Core alla build dell’applicazione

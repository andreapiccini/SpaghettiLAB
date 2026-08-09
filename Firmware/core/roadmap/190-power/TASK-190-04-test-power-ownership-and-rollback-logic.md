# TASK-190-04 — Provare proprietà e rollback di Power

**Stato:** ⬜ TODO
**Fase:** 190 — Power
**Dipende da:** [TASK-190-03](TASK-190-03-implement-reference-counting-with-a-fake-backend.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Corretto transition/count/status.

---

## File da aprire

`subsys/power/power.c` e un'imbracatura di prova fake-backend focalizzata.

---

## Cosa scrivere o modificare

Esercizio di due proprietari acquiring/releasing in entrambi gli ordini,
duplicate/invalid rilascia, overflow border, fake on failure, e fake off failure.
Confermare i conti e lo stato rimangono coerenti dopo ogni errore.

---

## Perché

I punti acquire/release esatti sono stabiliti da Manager.

---

## Chi usa il risultato

Manager/driver.

---

## Evento che attiva il codice

Modulo LIFECICLO.

---

## Meccanismo di invocazione

DIRECT CALL + K_MUTEX.

---

## Contesto di esecuzione

Solo thread, mai ISR.

---

## Chiamate e dipendenze

Port/Zephyr GPIO o runtime PM.

---

## Input

Valido owner/resource.

---

## Output

Corretto transition/count/status.

---

## Errori da gestire

Hardware on/off errore, overflow/underflow, rollback dopo guasto init.

---

## Non implementare ancora

- Sistema di sospensione fino alla misurazione dei requisiti runtime/device PM

---

## Procedura

- [ ] Aprire solo `subsys/power/power.c` e un'imbracatura di prova fake-backend
      focalizzata.
- [ ] Esercitare due proprietari acquiring/releasing in entrambi gli ordini,
      duplicate/invalid rilascia, overflow border, fake on failure, e fake off failure.
- [ ] Confermare i conteggi e lo stato rimangono coerenti dopo ogni errore.
- [ ] Gestisci solo questi errori realistici: Hardware on/off errore,
      overflow/underflow, rollback dopo guasto init.
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

Due proprietari acquire/release in entrambi gli ordini; iniezione non riuscita driver
init e confermare count/rail rollback.

---

## Risultato atteso

Una sulla transizione, una finale sulla transizione, nessuna prematura.

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

`power: test power ownership and rollback logic`

---

## Task successivo

[TASK-190-05](TASK-190-05-connect-power-to-the-real-control.md) — Collegare Power al controllo hardware reale

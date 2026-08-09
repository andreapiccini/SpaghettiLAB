# TASK-190-03 — Implementare il reference counting con backend finto

**Stato:** ⬜ TODO
**Fase:** 190 — Power
**Dipende da:** [TASK-190-02](TASK-190-02-define-the-power-public-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Corretto transition/count/status.

---

## File da aprire

`subsys/power/power.c`.

---

## Cosa scrivere o modificare

Implementa lo stato privato con un breve `k_mutex`: in primo luogo acquisire chiamate un
falso power-on hook, intermedio acquire/release solo cambiare il numero, e le chiamate
di rilascio finale power-off. Rifiutare overflow, underflow, e resource/owner non
valido.

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

DIRECT CALL + K_MUTEX

---

## Contesto di esecuzione

chiama thread

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

## Orientamento Zephyr

Utilizzare il mutex solo intorno alle transizioni di stato corto. Non chiamare mai
questo blocco API da ISR o timer contesto di callback.

---

## Procedura

- [ ] Apri solo `subsys/power/power.c`.
- [ ] Implementa lo stato privato con un breve `k_mutex`: prima acquisisci chiamate con
      un falso power-on hook, acquire/release intermedio cambia solo il conteggio e le
      chiamate a rilascio finale power-off.
- [ ] Rifiuta overflow, underflow e resource/owner non validi.
- [ ] Gestisci solo questi errori realistici: Hardware on/off errore,
      overflow/underflow, rollback dopo guasto init.
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

`power: implement reference counting with a fake backend`

---

## Task successivo

[TASK-190-04](TASK-190-04-test-power-ownership-and-rollback-logic.md) — Provare proprietà e rollback di Power

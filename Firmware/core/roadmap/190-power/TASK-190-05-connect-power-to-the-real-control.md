# TASK-190-05 — Collegare Power al controllo hardware reale

**Stato:** ⬜ TODO
**Fase:** 190 — Power
**Dipende da:** [TASK-190-04](TASK-190-04-test-power-ownership-and-rollback-logic.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Corretto transition/count/status.

---

## File da aprire

Port binding/board DTS e `subsys/power/power.c`.

---

## Cosa scrivere o modificare

Aggiungere il riferimento di potenza verificato alla descrizione dell'hardware statico e
implementare veri e propri ganci on/off tramite Port o l'appropriato Zephyr
GPIO/runtime-PM API. Preservare la polarità sicura misurata e propagare gli errori di
transizione.

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

## Orientamento Zephyr

Devicetree identifica il controllo fisico; il sottosistema Power possiede lo stato di
riferimento runtime e la politica di transizione.

---

## Procedura

- [ ] Apri solo Port binding/board DTS e `subsys/power/power.c`.
- [ ] Aggiungere il riferimento di potenza verificato alla descrizione dell'hardware
      statico e implementare veri e propri ganci on/off tramite Port o l'appropriato
      Zephyr GPIO/runtime-PM API. Preservare la polarità sicura misurata e propagare gli
      errori di transizione.
- [ ] Gestisci solo questi errori realistici: Hardware on/off errore,
      overflow/underflow, rollback dopo guasto init.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

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

`power: connect power to the real control`

---

## Task successivo

[TASK-190-06](TASK-190-06-integrate-power-with-manager-and-test-hardware.md) — Integrare Power con Manager e provare l’hardware

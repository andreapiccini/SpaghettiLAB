# TASK-190-06 — Integrare Power con Manager e provare l’hardware

**Stato:** ⬜ TODO
**Fase:** 190 — Power
**Dipende da:** [TASK-190-05](TASK-190-05-connect-power-to-the-real-control.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Corretto transition/count/status.

---

## File da aprire

`CMakeLists.txt`, `subsys/core/core.c`, `subsys/module_manager/module_manager.c` e
apparecchiature di misura reali.

---

## Cosa scrivere o modificare

Aggiungere il sorgente Power e inizializzarlo da Core. Manager acquisisce prima driver
init e rilascia dopo il deinit o ogni rollback. Misurare le transizioni
first-on/final-off e iniettare driver-init non confermare il rilascio.

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

- [ ] Apri solo `CMakeLists.txt`, `subsys/core/core.c`,
      `subsys/module_manager/module_manager.c` e apparecchiature di misura reali.
- [ ] Aggiungere il sorgente Power e inizializzarlo da Core. Manager acquisisce prima
      driver init e rilascia dopo il deinit o ogni rollback. Misurare le transizioni
      first-on/final-off e iniettare driver-init non confermare il rilascio.
- [ ] Gestisci solo questi errori realistici: Hardware on/off errore,
      overflow/underflow, rollback dopo guasto init.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Due proprietari acquire/release in entrambi gli ordini; iniezione non riuscita driver
init e confermare count/rail rollback.

---

## Risultato atteso

Due proprietari condividono una risorsa reale senza premature off, e l'inizializzazione
del modulo non è riuscita lo rilascia.

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

`power: integrate power with manager and test hardware`

---

## Task successivo

[Indice di backlog](../README.md) — definisce il prossimo requisito prima di aggiungere
lavoro.

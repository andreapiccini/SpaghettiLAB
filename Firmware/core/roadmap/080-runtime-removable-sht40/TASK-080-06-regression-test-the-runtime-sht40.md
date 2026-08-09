# TASK-080-06 — Eseguire il test di regressione di SHT40 runtime

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime
**Dipende da:** [TASK-080-05](TASK-080-05-remove-the-static-sensor-shortcut.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stessi valori senza nodo statico del modulo DT.

---

## File da aprire

`build/zephyr/.config`, `build/zephyr/zephyr.dts` e la console seriale.

---

## Cosa scrivere o modificare

Confermare l'uscita generata non ha alcuna istanza SHT4x o dipendenza da Sensor API.
Indirizzo Flash e test valido, indirizzo non valido, sensore mancante, guasto CRC dove
iniettabile, e un ciclo remove/reconfigure.

---

## Perché

Entrambi i percorsi sono stati confrontati su hardware reale.

---

## Chi usa il risultato

Costruisci e finali SHT40 driver.

---

## Evento che attiva il codice

Refattore dopo la prova dura.

---

## Meccanismo di invocazione

TEMPO DI COMPILAZIONE più DIRECT CALL runtime path.

---

## Contesto di esecuzione

Build/main thread.

---

## Chiamate e dipendenze

Solo Port I2C.

---

## Input

Runtime Port/address.

---

## Output

Stessi valori senza nodo statico del modulo DT.

---

## Errori da gestire

Kconfig/source dipende ancora dalle API del sensore.

---

## Non implementare ancora

- Personalizzato Port DT binding

---

## Procedura

- [ ] Aprire solo `build/zephyr/.config`, `build/zephyr/zephyr.dts` e la console
      seriale.
- [ ] Confermare l'uscita generata non ha alcuna istanza SHT4x o dipendenza da Sensor
      API. Indirizzo Flash e test valido, indirizzo non valido, sensore mancante, guasto
      CRC dove iniettabile, e un ciclo remove/reconfigure.
- [ ] Gestisci solo questi errori realistici: Kconfig/source a seconda delle API del
      sensore.
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

Cerca source/final DTS per `sht40_test` e compatibile statico; non confermare nessuno,
quindi verificare la misurazione.

---

## Risultato atteso

Il vero SHT40 è leggibile tramite Port e I2C diretto senza collegamento statico al
sensore.

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

`runtime-removable: regression-test the runtime sht40`

---

## Task successivo

[TASK-090-01](../090-config/TASK-090-01-define-the-internal-config-model.md) — Definire il modello interno di Config

# TASK-080-04 — Convalidare il CRC e convertire i campioni SHT40

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime
**Dipende da:** [TASK-080-03](TASK-080-03-implement-direct-i2c-sht40-measurement.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stessi valori reali del percorso statico driver.

---

## File da aprire

`spaghetti_modules/sht40/sht40.c`.

---

## Cosa scrivere o modificare

Implementa il controllo CRC descritto nel datasheet per entrambi i valori grezzi.
Converti temperatura e umidità nella rappresentazione già usata dal progetto, limita i
valori soltanto quando il datasheet lo richiede e restituisci un errore se il CRC non
corrisponde.

---

## Perché

Lo standard Zephyr SHT4x driver richiede un'istantanea statica DT.

---

## Chi usa il risultato

Module Manager tramite driver ops.

---

## Evento che attiva il codice

MODULO INIT/READ.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Manager/Runtime thread; riposo limitato se necessario.

---

## Chiamate e dipendenze

Port API e Zephyr I2C API.

---

## Input

Port, indirizzo runtime, campione di uscita.

---

## Output

Stessi valori reali del percorso statico driver.

---

## Errori da gestire

NACK, timeout, CRC, risposta grezza non valida, rimozione durante la lettura.

---

## Non implementare ancora

- Async I2C, modalità di riscaldamento, controllo automatico

---

## Procedura

- [ ] Apri solo `spaghetti_modules/sht40/sht40.c`.
- [ ] Implementa il foglio dati check CRC per entrambi i valori grezzi. Converti la
      temperatura e l'umidità grezzi nella rappresentazione del campione delimitata
      esistente, morsetto solo quando il foglio dati lo richiede, e restituire un errore
      per un disallineamento CRC.
- [ ] Gestisci solo questi errori realistici: NACK, timeout, CRC, risposta cruda non
      valida, rimozione durante la lettura.
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

Lettura reale ed errore del sensore disconnesso; confronta i valori plausibili con
l'uscita Milestone 4.

---

## Risultato atteso

Il driver non chiama più l'API del sensore.

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

`runtime-removable: validate crc and convert sht40 samples`

---

## Task successivo

[TASK-080-05](TASK-080-05-remove-the-static-sensor-shortcut.md) — Rimuovere la scorciatoia Sensor statica

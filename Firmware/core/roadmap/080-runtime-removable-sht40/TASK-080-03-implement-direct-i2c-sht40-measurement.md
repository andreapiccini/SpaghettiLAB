# TASK-080-03 — Implementare la misura SHT40 direttamente su I2C

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime
**Dipende da:** [TASK-080-02](TASK-080-02-pass-bounded-driver-configuration-through-manager.md)
**Impegno stimato:** Medio

---

## Obiettivo

Completa la misura **Implementazione diretta I2C SHT40** e produce questo risultato
mirato:

Stessi valori reali del percorso statico driver.

---

## File da aprire

`spaghetti_modules/sht40/sht40.c` e l'esatta scheda tecnica SHT40.

---

## Cosa scrivere o modificare

Sostituire il sensore API fetch/get all'interno di driver init/read con
`spaghetti_port_i2c_device()` e la transazione `i2c_write`, `i2c_read` o
`i2c_write_read` per la modalità di misura scelta. Mantenere costanti di protocollo
tracciabili alle sezioni del foglio dati.

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

## Orientamento Zephyr

Le chiamate Zephyr I2C possono bloccare e appartenere al contesto thread. Lo driver deve
utilizzare il controller di proprietà Port piuttosto che istigare un sensore rimovibile
in Devicetree.

---

## Procedura

- [ ] Aprire solo `spaghetti_modules/sht40/sht40.c` e l'esatto foglio dati SHT40.
- [ ] Sostituire il sensore API fetch/get all'interno di driver init/read con
      `spaghetti_port_i2c_device()` e la transazione `i2c_write`, `i2c_read` o
      `i2c_write_read` minima per la modalità di misura scelta.
- [ ] Mantenere costanti di protocollo rintracciabili alle sezioni del foglio dati.
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

`runtime-removable: implement direct-i2c sht40 measurement`

---

## Task successivo

[TASK-080-04](TASK-080-04-validate-crc-and-convert-sht40-samples.md) — Convalidare il CRC e convertire i campioni SHT40

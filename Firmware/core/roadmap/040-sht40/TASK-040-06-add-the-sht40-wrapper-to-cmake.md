# TASK-040-06 — Aggiungere il wrapper SHT40 a CMake

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-05](TASK-040-05-implement-the-temporary-sht40-wrapper.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Temperatura e umidità una volta al secondo.

---

## File da aprire

`CMakeLists.txt`.

---

## Cosa scrivere o modificare

Aggiungi `spaghetti_modules/sht40/sht40.c` a `target_sources(app PRIVATE ...)` senza
cambiare altre fonti.

---

## Perché

Non procedere alle astrazioni senza la prova bus/sensor reale.

---

## Chi usa il risultato

Imbracatura di prova principale.

---

## Evento che attiva il codice

BOOT/PERIODIC TEST LOOP.

---

## Meccanismo di invocazione

BUILD-TIME

---

## Contesto di esecuzione

build time

---

## Chiamate e dipendenze

Temporary wrapper -> Sensor API -> I2C.

---

## Input

Connected powered SHT40.

---

## Output

Temperatura e umidità una volta al secondo.

---

## Errori da gestire

Errore Init/read; log e riprova solo con una politica chiara.

---

## Non implementare ancora

- Programmazione Runtime, zbus, MQTT

---

## Procedura

- [ ] Apri solo `CMakeLists.txt`.
- [ ] Aggiungi `spaghetti_modules/sht40/sht40.c` a `target_sources(app PRIVATE ...)`
      senza cambiare altre fonti.
- [ ] Gestire solo questi errori realistici: Errore Init/read; registrare e riprovare
      solo con una politica chiara.
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

Osservare temperature/humidity plausibile; disconnettere il sensore e verificare un
errore limitato piuttosto che crash/hang; reconnect/reset.

---

## Risultato atteso

Valori reali SHT40 nel registro seriale.

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

`sht40: add the sht40 wrapper to cmake`

---

## Task successivo

[TASK-040-07](TASK-040-07-call-the-sht40-wrapper-from-main.md) — Chiamare il wrapper SHT40 da main

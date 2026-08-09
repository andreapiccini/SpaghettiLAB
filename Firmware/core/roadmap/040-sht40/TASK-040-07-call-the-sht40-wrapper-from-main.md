# TASK-040-07 — Chiamare il wrapper SHT40 da main

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-06](TASK-040-06-add-the-sht40-wrapper-to-cmake.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Temperatura e umidità una volta al secondo.

---

## File da aprire

`src/main.c`.

---

## Cosa scrivere o modificare

Dopo l'inizializzazione Core, chiamare `spaghetti_sht40_test_init()` una volta. Nel loop
esistente, chiamare la lettura temporanea una volta al secondo e stampare entrambi i
valori `sensor_value` utilizzando `val1` interi e `val2` assoluto a sei cifre; gestire
gli errori di lettura senza dipendere dalla formattazione `%f` di `printf`.

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

DIRECT CALL e `k_sleep`, non `K_TIMER` ancora.

---

## Contesto di esecuzione

Thread principale.

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

- [ ] Apri solo `src/main.c`.
- [ ] Dopo l'inizializzazione Core, chiamare `spaghetti_sht40_test_init()` una volta.
      Nel loop esistente, chiamare la lettura temporanea una volta al secondo e stampare
      entrambi i valori `sensor_value` utilizzando `val1` interi e `val2` assoluto a sei
      cifre
- [ ] gestire gli errori di lettura senza float printf.
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

`sht40: call the sht40 wrapper from main`

---

## Task successivo

[TASK-040-08](TASK-040-08-build-and-inspect-the-sht40-image.md) — Compilare e ispezionare l’immagine SHT40

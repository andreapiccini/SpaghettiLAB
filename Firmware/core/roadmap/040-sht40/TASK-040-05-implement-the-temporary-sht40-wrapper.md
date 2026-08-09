# TASK-040-05 — Implementare il wrapper temporaneo SHT40

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-04](TASK-040-04-declare-the-temporary-sht40-wrapper-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

`0` e due valori del sensore.

---

## File da aprire

Crea `spaghetti_modules/sht40/sht40.c`.

---

## Cosa scrivere o modificare

Ottenere `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`; implementare init con
`device_is_ready()`. Implementare leggere con `sensor_sample_fetch()` seguito da
`sensor_channel_get()` per la temperatura ambiente e l'umidità. Convalidare sia i
puntatori di uscita e propagare ogni errore Zephyr.

---

## Perché

Il risultato di un sensore di lavoro è la prossima prova di fetta verticale.

---

## Chi usa il risultato

Prova temporanea `main`.

---

## Evento che attiva il codice

BOOT e chiamata periodica di prova.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

API del dispositivo e del sensore Zephyr.

---

## Input

Due puntatori di uscita.

---

## Output

`0` e due valori del sensore.

---

## Errori da gestire

`-EINVAL`, dispositivo non pronto, errore fetch/get.

---

## Non implementare ancora

- zbus, registro driver, proprio thread, riscaldatore

---

## Orientamento Zephyr

L'API del sensore normalizza i canali del sensore tramite `struct sensor_value`.
Mantenere questo sincrono wrapper e non aggiungere thread.

---

## Procedura

- [ ] Apri solo Crea `spaghetti_modules/sht40/sht40.c`.
- [ ] Ottenere `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`
- [ ] implementare init con `device_is_ready()`.
- [ ] Implementa la lettura con `sensor_sample_fetch()` seguita da
      `sensor_channel_get()` per la temperatura ambiente e l'umidità.
- [ ] Convalidare entrambi i puntatori di output e propagare ogni errore Zephyr.
- [ ] Gestisci solo questi errori realistici: `-EINVAL`, dispositivo non pronto, errore
      fetch/get.
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

Esamina il valore di ritorno di ogni chiamata inferiore.

---

## Risultato atteso

Sottile wrapper, senza loop.

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

`sht40: implement the temporary sht40 wrapper`

---

## Task successivo

[TASK-040-06](TASK-040-06-add-the-sht40-wrapper-to-cmake.md) — Aggiungere il wrapper SHT40 a CMake

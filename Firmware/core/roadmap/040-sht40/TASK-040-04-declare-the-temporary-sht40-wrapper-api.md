# TASK-040-04 — Dichiarare l’API del wrapper temporaneo SHT40

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-03](TASK-040-03-enable-the-sensor-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

`0` e due valori del sensore.

---

## File da aprire

Crea `spaghetti_modules/sht40/sht40.h`.

---

## Cosa scrivere o modificare

Aggiungi una protezione include e dichiara `spaghetti_sht40_test_init()` più
`spaghetti_sht40_test_read(struct sensor_value *temperature, struct sensor_value
*humidity)`. Includi o dichiara in avanti solo ciò che queste firme richiedono.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> Questa API è intenzionalmente temporanea e verrà rimossa in
  [TASK-080-05](../080-runtime-removable-sht40/TASK-080-05-remove-the-static-sensor-shortcut.md).


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

## Procedura

- [ ] Apri solo Crea `spaghetti_modules/sht40/sht40.h`.
- [ ] Aggiungi una protezione include e dichiara `spaghetti_sht40_test_init()` più
      `spaghetti_sht40_test_read(struct sensor_value *temperature, struct sensor_value
      *humidity)`. Includi o dichiara in avanti solo ciò che queste firme richiedono.
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

`sht40: declare the temporary sht40 wrapper api`

---

## Task successivo

[TASK-040-05](TASK-040-05-implement-the-temporary-sht40-wrapper.md) — Implementare il wrapper temporaneo SHT40

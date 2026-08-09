# TASK-040-03 — Abilitare l’API Sensor di Zephyr

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-02](TASK-040-02-add-the-temporary-sht40-devicetree-node.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

`0` e due valori del sensore.

---

## File da aprire

`prj.conf`.

---

## Cosa scrivere o modificare

Aggiungi `CONFIG_SENSOR=y`. Dopo la configurazione, confermare `CONFIG_SHT4X=y` viene
selezionato automaticamente dal nodo compatibile abilitato; non forzare i driver dei
sensori non collegati.

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

Kconfig seleziona il codice Sensor API e driver al momento della compilazione. La scheda
overlay seleziona l'istanza del dispositivo SHT4x in cemento.

---

## Procedura

- [ ] Apri solo `prj.conf`.
- [ ] Aggiungi `CONFIG_SENSOR=y`. Dopo la configurazione, confermare `CONFIG_SHT4X=y`
      viene selezionato automaticamente dal nodo compatibile abilitato
- [ ] non forzano i driver dei sensori non collegati.
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

`sht40: enable the sensor api`

---

## Task successivo

[TASK-040-04](TASK-040-04-declare-the-temporary-sht40-wrapper-api.md) — Dichiarare l’API del wrapper temporaneo SHT40

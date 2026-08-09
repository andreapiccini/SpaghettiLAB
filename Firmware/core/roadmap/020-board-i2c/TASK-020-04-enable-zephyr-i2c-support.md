# TASK-020-04 — Abilitare il supporto I2C di Zephyr

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C
**Dipende da:** [TASK-020-03](TASK-020-03-enable-the-i2c-node-in-the-board-overlay.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

API I2C collegate.

---

## File da aprire

`prj.conf`.

---

## Cosa scrivere o modificare

Aggiungi `CONFIG_I2C=y`. Questo compila in modo permanente le API generiche del
controller I2C richieste dalle porte I2C.

---

## Perché

DTS descrive l'hardware; Kconfig include il supporto software.

---

## Chi usa il risultato

Port e successivamente SHT40.

---

## Evento che attiva il codice

BUILD.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

Kconfig/CMake.

---

## Chiamate e dipendenze

Installato ESP32 I2C driver.

---

## Input

`CONFIG_I2C=y`.

---

## Output

API I2C collegate.

---

## Errori da gestire

Dipendenza del controller insoddisfatta mostrata dall'avvertimento Kconfig.

---

## Non implementare ancora

- `CONFIG_SENSOR`, zbus, MQTT

---

## Orientamento Zephyr

`CONFIG_I2C=y` compila il generico Zephyr I2C API e il controller selezionato driver.
Non descrive pin e non è configurazione runtime.

---

## Procedura

- [ ] Apri solo `prj.conf`.
- [ ] Aggiungi `CONFIG_I2C=y`. Questo compila in modo permanente le API generiche del
      controller I2C richieste dalle porte I2C.
- [ ] Gestisci solo questi errori realistici: dipendenze del controller insoddisfatta
      mostrata da Kconfig warning.
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

Trova controller abilitato e pin reali in `build/zephyr/zephyr.dts`; trova
`CONFIG_I2C=y` in `build/zephyr/.config`.

---

## Risultato atteso

Build riesce; il nodo del controller è `okay`.

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

`current: enable zephyr i2c support`

---

## Task successivo

[TASK-020-05](TASK-020-05-inspect-generated-i2c-configuration.md) — Controllare la configurazione I2C generata

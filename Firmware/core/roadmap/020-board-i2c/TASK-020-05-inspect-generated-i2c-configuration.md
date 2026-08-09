# TASK-020-05 — Controllare la configurazione I2C generata

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C
**Dipende da:** [TASK-020-04](TASK-020-04-enable-zephyr-i2c-support.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

API I2C collegate.

---

## File da aprire

`build/zephyr/zephyr.dts` e `build/zephyr/.config`.

---

## Cosa scrivere o modificare

Dopo una build pulita, confermare che il controller selezionato è `okay`,
i pin generati corrispondono allo schema verificato, e `.config` contiene
`CONFIG_I2C=y`. Non modificare né il file generato.

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

## Procedura

- [ ] Apri solo `build/zephyr/zephyr.dts` e `build/zephyr/.config`.
- [ ] Dopo una build pulita, confermare che il controller selezionato è
      `okay`, i pin generati corrispondono allo schema verificato, e `.config` contiene
      `CONFIG_I2C=y`.
- [ ] Non modificare né il file generato.
- [ ] Gestisci solo questi errori realistici: dipendenze del controller insoddisfatta
      mostrata da Kconfig warning.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

NO

---

## Verifica

Cerca il DTS generato per il nodo del controller e `.config` per `CONFIG_I2C=y`.

---

## Risultato atteso

La configurazione generata dimostra che sia il nodo hardware che il software I2C sono
abilitati.

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

`current: inspect generated i2c configuration`

---

## Task successivo

[TASK-020-06](TASK-020-06-flash-the-i2c-baseline.md) — Caricare e provare la baseline I2C

# TASK-020-06 — Caricare e provare la baseline I2C

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C
**Dipende da:** [TASK-020-05](TASK-020-05-inspect-generated-i2c-configuration.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

API I2C collegate.

---

## File da aprire

`README.md` e la console seriale.

---

## Cosa scrivere o modificare

Non aggiungere codice. Lanciare l'immagine generata dalla build pulita e verificare che il controller
non utilizzato non abbia rotto l'avvio o la console USB.

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

- [ ] Aprire solo `README.md` e la console seriale.
- [ ] Non aggiungere codice. Lanciare l'immagine generata dalla build pulita e verificare che il
      controller non utilizzato non abbia rotto l'avvio o la console USB.
- [ ] Gestisci solo questi errori realistici: dipendenze del controller insoddisfatta
      mostrata da Kconfig warning.
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

Trova controller abilitato e pin reali in `build/zephyr/zephyr.dts`; trova
`CONFIG_I2C=y` in `build/zephyr/.config`.

---

## Risultato atteso

Il firmware si avvia normalmente con il controller I2C verificato abilitato.

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

`current: flash the i2c baseline`

---

## Task successivo

[TASK-030-01](../030-port/TASK-030-01-define-the-port-identifier.md) — Definire l’identificatore di Port

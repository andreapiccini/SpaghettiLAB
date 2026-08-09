# TASK-080-05 — Rimuovere la scorciatoia Sensor statica

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime
**Dipende da:** [TASK-080-04](TASK-080-04-validate-crc-and-convert-sht40-samples.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stessi valori senza nodo statico del modulo DT.

---

## File da aprire

`boards/esp32c3_devkitm_esp32c3.overlay`, `prj.conf`, `spaghetti_modules/sht40/sht40.h`
e `spaghetti_modules/sht40/sht40.c`.

---

## Cosa scrivere o modificare

Eliminare il nodo `sht40_test` Devicetree, il test temporaneo API,
`DT_NODELABEL(sht40_test)` e tutte le chiamate `sensor_*`. Rimuovere `CONFIG_SENSOR=y`
se nessun altro consumatore ne ha bisogno; mantenere `CONFIG_I2C=y` e il percorso di
indirizzo runtime.

---

## Perché

Entrambi i percorsi sono stati confrontati su hardware reale.

---

## Chi usa il risultato

Costruisci e finali SHT40 driver.

---

## Evento che attiva il codice

Refattore dopo la prova dura.

---

## Meccanismo di invocazione

TEMPO DI COMPILAZIONE più DIRECT CALL runtime path.

---

## Contesto di esecuzione

Build/main thread.

---

## Chiamate e dipendenze

Solo Port I2C.

---

## Input

Runtime Port/address.

---

## Output

Stessi valori senza nodo statico del modulo DT.

---

## Errori da gestire

Kconfig/source dipende ancora dalle API del sensore.

---

## Non implementare ancora

- Personalizzato Port DT binding

---

## Orientamento Zephyr

La rimozione del nodo dimostra identità rimovibile è stato runtime. La scheda Devicetree
deve continuare a descrivere solo il controller fisico I2C e il cablaggio Port.

---

## Procedura

- [ ] Apri solo `boards/esp32c3_devkitm_esp32c3.overlay`, `prj.conf`,
      `spaghetti_modules/sht40/sht40.h` e `spaghetti_modules/sht40/sht40.c`.
- [ ] Eliminare il nodo `sht40_test` Devicetree, il test temporaneo API,
      `DT_NODELABEL(sht40_test)` e tutte le chiamate `sensor_*`.
- [ ] Rimuovere `CONFIG_SENSOR=y` se nessun altro consumatore ne ha bisogno
- [ ] mantenere `CONFIG_I2C=y` e il percorso dell'indirizzo runtime.
- [ ] Gestisci solo questi errori realistici: Kconfig/source a seconda delle API del
      sensore.
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

Cerca source/final DTS per `sht40_test` e compatibile statico; non confermare nessuno,
quindi verificare la misurazione.

---

## Risultato atteso

Port 0/SHT40 è runtime-configurato e funzionante.

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

`runtime-removable: remove the static sensor shortcut`

---

## Task successivo

[TASK-080-06](TASK-080-06-regression-test-the-runtime-sht40.md) — Eseguire il test di regressione di SHT40 runtime

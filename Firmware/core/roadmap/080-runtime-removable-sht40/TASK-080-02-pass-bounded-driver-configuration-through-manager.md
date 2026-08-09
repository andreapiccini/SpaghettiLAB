# TASK-080-02 — Passare al Manager una configurazione driver limitata

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime
**Dipende da:** [TASK-080-01](TASK-080-01-define-the-sht40-runtime-configuration.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Il contesto di per-instance ha indirizzo e Port.

---

## File da aprire

`include/spaghetti/module_driver.h`, `include/spaghetti/module_manager.h` e
`subsys/module_manager/module_manager.c`.

---

## Cosa scrivere o modificare

Estendere il contratto driver initialization/configure con un puntatore di
configurazione limitato e lunghezza, o una configurazione iniziale di tipo altrettanto
piccolo. Convalidare pointer/length prima di driver init e garantire che l'istanza
possiede tutti i dati che devono sopravvivere alla chiamata.

---

## Perché

I moduli rimovibili non possono contare su un sensore Zephyr pre-istanziato.

---

## Chi usa il risultato

Gestore crea; SHT40 init/read consuma.

---

## Evento che attiva il codice

Configurazione del modulo.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Manager/caller thread.

---

## Chiamate e dipendenze

Contratto di config Module/driver.

---

## Input

Indirizzo verificato come 0x44 dalla configurazione.

---

## Output

Il contesto di per-instance ha indirizzo e Port.

---

## Errori da gestire

Indirizzo Invalid/out-of-range e configurazione errata size/type.

---

## Non implementare ancora

- Schema full channel, EEPROM, indirizzi alternativi indovinati

---

## Procedura

- [ ] Apri solo `include/spaghetti/module_driver.h`,
      `include/spaghetti/module_manager.h` e `subsys/module_manager/module_manager.c`.
- [ ] Estendere il contratto driver initialization/configure con un puntatore e una
      lunghezza limitati, o una configurazione iniziale di tipo ugualmente piccolo.
- [ ] Convalidare pointer/length prima di driver init e garantire che l'istanza possiede
      tutti i dati che devono sopravvivere alla chiamata.
- [ ] Gestisci solo questi errori realistici: indirizzo Invalid/out-of-range e
      configurazione errata size/type.
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

La validazione Config accetta l'indirizzo verificato e rifiuta i valori non validi.

---

## Risultato atteso

Nessun indirizzo driver-global runtime.

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

`runtime-removable: pass bounded driver configuration through manager`

---

## Task successivo

[TASK-080-03](TASK-080-03-implement-direct-i2c-sht40-measurement.md) — Implementare la misura SHT40 direttamente su I2C

# TASK-080-01 — Definire la configurazione runtime di SHT40

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime
**Dipende da:** [TASK-070-06](../070-module-manager/TASK-070-06-test-manager-success-and-rollback.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Il contesto di per-instance ha indirizzo e Port.

---

## File da aprire

`spaghetti_modules/sht40/sht40.h`.

---

## Cosa scrivere o modificare

Definire `struct spaghetti_sht40_config` con solo l'indirizzo I2C verificato.
Documentare la proprietà e l'intervallo di indirizzi valido; non includere un puntatore
del sensore Zephyr.

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

- [ ] Apri solo `spaghetti_modules/sht40/sht40.h`.
- [ ] Definire `struct spaghetti_sht40_config` con solo l'indirizzo I2C verificato.
- [ ] Documenta la sua proprietà e l'intervallo di indirizzi valido
- [ ] non includono un puntatore del sensore Zephyr.
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

`runtime-removable: define the sht40 runtime configuration`

---

## Task successivo

[TASK-080-02](TASK-080-02-pass-bounded-driver-configuration-through-manager.md) — Passare al Manager una configurazione driver limitata

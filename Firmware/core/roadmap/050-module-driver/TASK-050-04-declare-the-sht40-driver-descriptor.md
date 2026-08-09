# TASK-050-04 — Dichiarare il descrittore del driver SHT40

**Stato:** ⬜ TODO
**Fase:** 050 — Module + Module Driver
**Dipende da:** [TASK-050-03](TASK-050-03-define-the-module-driver-operation-table.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stessi valori reali di Milestone 4.

---

## File da aprire

`spaghetti_modules/sht40/sht40.h`.

---

## Cosa scrivere o modificare

Dichiarare l'immutabile descrittore esportato `extern const struct
spaghetti_module_driver spaghetti_sht40_driver;`. Mantenere l'API temporanea porta-up
fino a quando il percorso operation-table è dimostrato.

---

## Perché

Il registro deve memorizzare un descrittore driver testato.

---

## Chi usa il risultato

Imbragatura principale temporanea.

---

## Evento che attiva il codice

BOOT/PERIODIC LEGGERE.

---

## Meccanismo di invocazione

Chiamata diretta attraverso il tavolo operatorio.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Sensore SHT4x temporaneo wrapper.

---

## Input

Modulo con Port 0 e campione di uscita.

---

## Output

Stessi valori reali di Milestone 4.

---

## Errori da gestire

Op mancante, Port incompatibile, precedenti errori del sensore.

---

## Non implementare ancora

- Cerca Registry/Manager o zbus

---

## Procedura

- [ ] Apri solo `spaghetti_modules/sht40/sht40.h`.
- [ ] Dichiarare l'immutabile descrittore esportato `extern const struct
      spaghetti_module_driver spaghetti_sht40_driver;`.
- [ ] Mantenere l'API temporanea fino a prova del percorso della tabella delle
      operazioni.
- [ ] Gestisci solo questi errori realistici: Op mancante, Port incompatibile, errori
      precedenti del sensore.
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

Assicurarsi che le funzioni di calcestruzzo `sensor_*` o SHT40 non siano mai chiamate
direttamente; chiama puntatori operativi.

---

## Risultato atteso

Misure immutate tramite contratto generico driver.

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

`module: declare the sht40 driver descriptor`

---

## Task successivo

[TASK-050-05](TASK-050-05-adapt-sht40-to-driver-operations.md) — Adattare SHT40 alle operazioni del driver

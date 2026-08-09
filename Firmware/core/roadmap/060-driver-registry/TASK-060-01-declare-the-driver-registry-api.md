# TASK-060-01 — Dichiarare l’API di Driver Registry

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry
**Dipende da:** [TASK-050-06](../050-module-driver/TASK-050-06-exercise-sht40-through-the-operation-table.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Descrittore const o `NULL` per sconosciuto.

---

## File da aprire

`include/spaghetti/driver_registry.h`.

---

## Cosa scrivere o modificare

Dichiara `int spaghetti_driver_registry_init(void);`, `const struct
spaghetti_module_driver *spaghetti_driver_registry_find(const char *type_id);` e
opzionalmente `size_t spaghetti_driver_registry_count(void);`.

---

## Perché

Il descrittore SHT40 testato è pronto per essere registrato.

---

## Chi usa il risultato

Core inizializza; Manager trova; Communication conta successivamente.

---

## Evento che attiva il codice

Configurazione BOOT/MODULE.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale o thread chiamante.

---

## Chiamate e dipendenze

Tipo di driver del modulo.

---

## Input

ID null-terminato del tipo limitato.

---

## Output

Descrittore const o `NULL` per sconosciuto.

---

## Errori da gestire

Chiave Null/empty e descrittori duplicati durante l'init.

---

## Non implementare ancora

- Registrazione Runtime, hash table, sezioni iterabili

---

## Procedura

- [ ] Apri solo `include/spaghetti/driver_registry.h`.
- [ ] Dichiara `int spaghetti_driver_registry_init(void);`, `const struct
      spaghetti_module_driver *spaghetti_driver_registry_find(const char *type_id);` e
      opzionalmente `size_t spaghetti_driver_registry_count(void);`.
- [ ] Gestisci solo questi errori realistici: chiave Null/empty e descrittori duplicati
      durante l'init.
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

Recensione API: il registro non inizializza mai la driver.

---

## Risultato atteso

Un contratto di ricerca minimo immutabile.

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

`driver: declare the driver registry api`

---

## Task successivo

[TASK-060-02](TASK-060-02-implement-the-fixed-driver-table.md) — Implementare la tabella statica dei driver

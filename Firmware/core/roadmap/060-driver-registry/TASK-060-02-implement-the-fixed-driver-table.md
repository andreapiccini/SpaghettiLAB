# TASK-060-02 — Implementare la tabella statica dei driver

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry
**Dipende da:** [TASK-060-01](TASK-060-01-declare-the-driver-registry-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Puntatore SHT40 o `NULL`.

---

## File da aprire

`subsys/driver_registry/driver_registry.c`.

---

## Cosa scrivere o modificare

Crea un array di puntatore immutabile privato contenente `&spaghetti_sht40_driver`.
Implementa la stringa esatta `spaghetti_driver_registry_find()` e il contatore opzionale
con comportamento null-safe.

---

## Perché

Uno driver non giustifica la magia del linker o un tavolo di hash.

---

## Chi usa il risultato

Core/Manager.

---

## Evento che attiva il codice

BOOT/LOOKUP.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Chiamatore thread; immutabile dopo init.

---

## Chiamate e dipendenze

Il descrittore SHT40 e il confronto delle stringhe standard.

---

## Input

`"sht40"` o un altro ID.

---

## Output

Puntatore SHT40 o `NULL`.

---

## Errori da gestire

Tabella Duplicate/invalid; la ricerca sconosciuta è normale.

---

## Non implementare ancora

- Bloccaggio
- ricerca surgelata non ha bisogno di nessuno

---

## Procedura

- [ ] Apri solo `subsys/driver_registry/driver_registry.c`.
- [ ] Crea un array di puntatore immutabile privato contenente
      `&spaghetti_sht40_driver`.
- [ ] Implementa la stringa esatta `spaghetti_driver_registry_find()` e il contatore
      opzionale con comportamento null-safe.
- [ ] Gestisci solo questi errori realistici: tabella Duplicate/invalid; la ricerca
      sconosciuta è normale.
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

Percorso di test locale per ID noti e sconosciuti.

---

## Risultato atteso

Registro lineare deterministico.

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

`driver: implement the fixed driver table`

---

## Task successivo

[TASK-060-03](TASK-060-03-validate-registry-entries.md) — Convalidare le voci del registry

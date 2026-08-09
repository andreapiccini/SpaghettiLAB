# TASK-060-03 — Convalidare le voci del registry

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry
**Dipende da:** [TASK-060-02](TASK-060-02-implement-the-fixed-driver-table.md)
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

Implementa la validazione `spaghetti_driver_registry_init()` per i descrittori null,
null/empty di tipo ID, mancano i puntatori di funzionamento richiesti e duplicati di
tipo ID. Restituisci il primo errore realistico senza modificare la tabella dei conti.

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
- [ ] Implementa la convalida `spaghetti_driver_registry_init()` per i descrittori null,
      null/empty di tipo ID, mancano i puntatori di funzionamento richiesti e i
      duplicati di tipo ID.
- [ ] Restituisce il primo errore realistico senza modificare la tabella dei conti.
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

`driver: validate registry entries`

---

## Task successivo

[TASK-060-04](TASK-060-04-initialize-the-registry-from-core.md) — Inizializzare Driver Registry da Core

# TASK-070-02 — Implementare lo stato Manager con uno slot

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager
**Dipende da:** [TASK-070-01](TASK-070-01-declare-the-module-manager-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Identificazione dell'istanza e campione.

---

## File da aprire

`subsys/module_manager/module_manager.c`.

---

## Cosa scrivere o modificare

Crea uno slot `spaghetti_module` privato più un flag usato. Implementa
`spaghetti_module_manager_init()` per cancellare tutti gli stati e definire gli helper
ID/occupancy severi senza chiamare driver ancora.

---

## Perché

Uno slot rende failure/ownership visibile prima di aggiungere complessità.

---

## Chi usa il risultato

Principale test/Runtime.

---

## Evento che attiva il codice

MODULO CONFIGURATION/READ.

---

## Meccanismo di invocazione

Catena di CHIAMATE DIRETTE.

---

## Contesto di esecuzione

Thread principale o thread chiamante.

---

## Chiamate e dipendenze

`port_get` -> `registry_find` -> `driver->init/read`.

---

## Input

ID validi e puntatori di output.

---

## Output

Identificazione dell'istanza e campione.

---

## Errori da gestire

`-EINVAL`, `-ENOENT`, `-ENOTSUP`, `-EBUSY`, driver errno.

---

## Non implementare ancora

- Threads, codes, replacement, callbacks

---

## Procedura

- [ ] Apri solo `subsys/module_manager/module_manager.c`.
- [ ] Crea uno slot `spaghetti_module` privato più un flag usato.
- [ ] Implementa `spaghetti_module_manager_init()` per cancellare tutto lo stato e
      definire gli helper ID/occupancy rigorosi senza chiamare ancora driver.
- [ ] Gestisci solo questi errori realistici: `-EINVAL`, `-ENOENT`, `-ENOTSUP`,
      `-EBUSY`, driver errno.
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

Tracciare mentalmente il rollback prima di compilare.

---

## Risultato atteso

Nessuna istanza parzialmente READY dopo il fallimento.

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

`module: implement the one-slot manager state`

---

## Task successivo

[TASK-070-03](TASK-070-03-implement-manager-configure.md) — Implementare la configurazione nel Manager

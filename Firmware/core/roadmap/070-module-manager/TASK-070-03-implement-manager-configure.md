# TASK-070-03 — Implementare la configurazione nel Manager

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager
**Dipende da:** [TASK-070-02](TASK-070-02-implement-the-one-slot-manager-state.md)
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

Implementa la configurazione in questo ordine: convalidare il puntatore di uscita e lo
slot libero; chiamare `spaghetti_port_get()`; chiamare
`spaghetti_driver_registry_find()`; verificare le capacità richieste; popolare lo stato
provvisorio; chiamare driver `init`; commit READY e ID di output solo in caso di
successo. Cancellare lo slot su ogni guasto.

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
- [ ] Implementare la configurazione in questo ordine: convalidare il puntatore di
      uscita e lo slot libero
- [ ] Chiama `spaghetti_port_get()`
- [ ] Chiama `spaghetti_driver_registry_find()`
- [ ] verifica le capacità richieste
- [ ] Stato provvisorio popolato
- [ ] Chiama driver `init`
- [ ] commit READY e ID di output solo su successo. Cancellare lo slot su ogni guasto.
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

`module: implement manager configure`

---

## Task successivo

[TASK-070-04](TASK-070-04-implement-manager-read.md) — Implementare la lettura nel Manager

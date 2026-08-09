# TASK-070-01 — Dichiarare l’API di Module Manager

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager
**Dipende da:** [TASK-060-05](../060-driver-registry/TASK-060-05-test-known-and-unknown-driver-lookup.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Pronta istanza e campione reale.

---

## File da aprire

`include/spaghetti/module_manager.h`.

---

## Cosa scrivere o modificare

Dichiarare `int spaghetti_module_manager_init(void);`, `int
spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char *type_id,
spaghetti_module_id_t *out_id);`, `const struct spaghetti_module
*spaghetti_module_manager_get_by_port(...)` e `int
spaghetti_module_manager_read(spaghetti_module_id_t id, struct spaghetti_sample *out);`.

---

## Perché

Port e Registry sono provati in modo indipendente.

---

## Chi usa il risultato

Test Core/main; Runtime più tardi.

---

## Evento che attiva il codice

RICHIESTA BOOT TEST/MODULE CONFIGURATION/READ.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread chiamante.

---

## Chiamate e dipendenze

Port, Registry, driver ops.

---

## Input

Port 0, `"sht40"`, uscita ID/sample.

---

## Output

Pronta istanza e campione reale.

---

## Errori da gestire

port/type non valido, porta occupata, nessun slot, errore init/read.

---

## Non implementare ancora

- Remove/replace, mutex, piscina dinamica, scoperta

---

## Procedura

- [ ] Apri solo `include/spaghetti/module_manager.h`.
- [ ] Dichiarare `int spaghetti_module_manager_init(void);`, `int
      spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char
      *type_id, spaghetti_module_id_t *out_id);`, `const struct spaghetti_module
      *spaghetti_module_manager_get_by_port(...)` e `int
      spaghetti_module_manager_read(spaghetti_module_id_t id, struct spaghetti_sample
      *out);`.
- [ ] Gestisci solo questi errori realistici: port/type non valido, porta occupata,
      nessun slot, errore init/read.
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

Proprietà: CREATED/OWNED/MODIFIED/DESTROYED da Manager.

---

## Risultato atteso

API limitata a un caso di configurazione.

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

`module: declare the module manager api`

---

## Task successivo

[TASK-070-02](TASK-070-02-implement-the-one-slot-manager-state.md) — Implementare lo stato Manager con uno slot

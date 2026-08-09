# TASK-100-01 — Definire l’API di storage sincrono

**Stato:** ⬜ TODO
**Fase:** 100 — Config persistente
**Dipende da:** [TASK-090-06](../090-config/TASK-090-06-test-config-validation-and-apply.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Found/not-found/corrupt/status.

---

## File da aprire

Crea `subsys/services/storage/storage.h`.

---

## Cosa scrivere o modificare

Dichiara `spaghetti_storage_init()`, `spaghetti_storage_read_config()` e
`spaghetti_storage_write_config()` intorno a un record fisso versione. Definisci
proprietario buffer/snapshot esplicito e codici di ritorno realistici.

---

## Perché

Il modello interno è collaudato e abbastanza piccolo per la versione.

---

## Chi usa il risultato

Solo Core/Config.

---

## Evento che attiva il codice

BOOT/VALID CONFIG AGGIORNAMENTO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Main/calling thread; mai ISR.

---

## Chiamate e dipendenze

Inizialmente memoria; successivamente Zephyr Settings.

---

## Input

Config record/destination.

---

## Output

Found/not-found/corrupt/status.

---

## Errori da gestire

Il record mancante è normale; size/version/corruption sbagliato.

---

## Non implementare ancora

- Storia delle misurazioni o blob arbitrarie

---

## Procedura

- [ ] Apri solo Crea `subsys/services/storage/storage.h`.
- [ ] Dichiara `spaghetti_storage_init()`, `spaghetti_storage_read_config()` e
      `spaghetti_storage_write_config()` intorno a un record fisso versione.
- [ ] Definire la proprietà buffer/snapshot esplicita e codici di ritorno realistici.
- [ ] Gestisci solo questi errori realistici: Il record mancante è normale;
      size/version/corruption sbagliato.
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

Uguaglianza Write/read e rifiuto della versione errata.

---

## Risultato atteso

Config può dipendere dal contratto Storage, non da API flash.

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

`persistent: define the synchronous storage api`

---

## Task successivo

[TASK-100-02](TASK-100-02-implement-and-test-a-ram-storage-backend.md) — Implementare e provare il backend storage RAM

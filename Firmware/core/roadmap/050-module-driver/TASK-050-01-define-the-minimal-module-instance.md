# TASK-050-01 — Definire l’istanza minima di Module

**Stato:** ⬜ TODO
**Fase:** 050 — Module + Module Driver
**Dipende da:** [TASK-040-09](../040-sht40/TASK-040-09-flash-and-test-the-real-sht40.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Layout minimo di istanza runtime.

---

## File da aprire

`include/spaghetti/module.h`.

---

## Cosa scrivere o modificare

Definire i valori di stato `spaghetti_module_id_t`, `UNINITIALIZED`, `READY` e `ERROR`,
e `struct spaghetti_module` con solo ID, Port puntatore, driver puntatore e context
puntatore al contesto privato. Dichiara in anticipo i tipi Port e driver per evitare
dipendenze circolari tra gli header.

---

## Perché

Registry/Manager ha bisogno di un piccolo oggetto comune, non del modello finale enorme.

---

## Chi usa il risultato

Operazioni con driver, Manager, Runtime in seguito.

---

## Evento che attiva il codice

Configurazione del modulo.

---

## Meccanismo di invocazione

Call direct object passing.

---

## Contesto di esecuzione

Sto chiamando thread.

---

## Chiamate e dipendenze

Solo dichiarazioni Port/driver.

---

## Input

Campi forniti dal gestore.

---

## Output

Layout minimo di istanza runtime.

---

## Errori da gestire

Nessuna nel tipo; documento relazioni invalid/null.

---

## Non implementare ancora

- Nomi, metadati di scoperta, code di dati, stato MQTT

---

## Procedura

- [ ] Apri solo `include/spaghetti/module.h`.
- [ ] Definire i valori di stato `spaghetti_module_id_t`, `UNINITIALIZED`, `READY` e
      `ERROR`, e `struct spaghetti_module` con solo ID, Port puntatore, driver puntatore
      e puntatore al contesto privato. Dichiara in anticipo i tipi Port e driver per
      evitare dipendenze
      cicliche.
- [ ] Gestisci solo questi errori realistici: Nessuno nel tipo; documento relazioni
      invalid/null.
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

Checklist di proprietà: CREATED/OWNED/MODIFIED/DESTROYED by Manager; READ by
driver/Runtime/Communication.

---

## Risultato atteso

L'istanza e il tipo sono chiaramente distinti.

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

`module: define the minimal module instance`

---

## Task successivo

[TASK-050-02](TASK-050-02-define-the-temporary-sample-contract.md) — Definire il contratto temporaneo del campione

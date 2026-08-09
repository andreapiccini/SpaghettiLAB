# TASK-190-02 — Definire l’API pubblica di Power

**Stato:** ⬜ TODO
**Fase:** 190 — Power
**Dipende da:** [TASK-190-01](TASK-190-01-verify-controllable-power-hardware.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Lease/status e stato contato di riferimento.

---

## File da aprire

`include/spaghetti/power.h`.

---

## Cosa scrivere o modificare

Definire una risorsa ID/state contratto e dichiarare Power init, acquisire, rilasciare,
e get-status funzioni. identità del proprietario del documento, limiti di conteggio di
riferimento, thread-solo chiamate, e underflow comportamento.

---

## Perché

Il ciclo di vita del modulo e i fatti statici multi-board sono stabili.

---

## Chi usa il risultato

Ciclo di vita Manager/driver; stato Communication.

---

## Evento che attiva il codice

MODULO CONFIGURATION/REMOVAL.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Manager/calling thread.

---

## Chiamate e dipendenze

Port potenza control/Zephyr GPIO o PM basato su hardware reale.

---

## Input

Identita' risorsa e proprietario.

---

## Output

Lease/status e stato contato di riferimento.

---

## Errori da gestire

Risorsa non supportata, fallimento della transizione, rilascio underflow/double.

---

## Non implementare ancora

- Politica della batteria, sonno profondo, fonti speculative di veglia, OTA

---

## Procedura

- [ ] Apri solo `include/spaghetti/power.h`.
- [ ] Definire una risorsa ID/state contratto e dichiarare Power init, acquisire,
      rilasciare, e get-status funzioni.
- [ ] Identità del proprietario del documento, limiti di conteggio di riferimento,
      chiamate thread-solo, e comportamento di sottoflusso.
- [ ] Gestisci solo questi errori realistici: risorsa non supportata, guasto alla
      transizione, rilascio underflow/double.
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

Recensione di progettazione Ownership/reference-count.

---

## Risultato atteso

Minima contratto di risorse reali.

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

`power: define the power public api`

---

## Task successivo

[TASK-190-03](TASK-190-03-implement-reference-counting-with-a-fake-backend.md) — Implementare il reference counting con backend finto

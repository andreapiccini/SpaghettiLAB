# TASK-130-05 — Definire una regola di soglia

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-130-04](TASK-130-04-route-commands-through-module-manager.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Relay ON solo per valori rigorosamente superiori alla soglia.

---

## File da aprire

`include/spaghetti/runtime.h`.

---

## Cosa scrivere o modificare

Definisci `spaghetti_runtime_threshold_rule` con modulo e canale sorgente, soglia in
unità fissa, ID del relè di destinazione e valore booleano da applicare. Dichiara
`spaghetti_runtime_load_threshold_rule()` e limita esplicitamente questa versione a una
sola regola.

---

## Perché

Sia il sensore Data che il comando relè funzionano indipendentemente.

---

## Chi usa il risultato

Carichi Config; Runtime valuta.

---

## Evento che attiva il codice

ARRIVO DATI.

---

## Meccanismo di invocazione

ZBUS MSG SUBSCRIBER -> Runtime THREAD -> DIRECT CALL.

---

## Contesto di esecuzione

Runtime thread.

---

## Chiamate e dipendenze

Data subscriber e comando Manager.

---

## Input

Campione di temperatura e una regola.

---

## Output

Relay ON solo per valori rigorosamente superiori alla soglia.

---

## Errori da gestire

Manca target/source, canale sbagliato, comando fallito.

---

## Non implementare ancora

- Generico operators/actions, isteresi a meno che non sia necessario per test fisici
  sicuri, array di regole, scripting

---

## Procedura

- [ ] Apri solo `include/spaghetti/runtime.h`.
- [ ] Definisci solo `spaghetti_runtime_threshold_rule` con sorgente module/channel,
      soglia di unità fissa, ID del relè di destinazione e booleano di destinazione.
- [ ] Dichiara `spaghetti_runtime_load_threshold_rule()` con semantica a singola regola
      delimitata.
- [ ] Gestisci solo questi errori realistici: Manca target/source, canale sbagliato,
      errore di comando.
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

Inietti 24.9, 25.0, 25.1 campioni di unità fissa; attenda il comando no/no/one.

---

## Risultato atteso

Semantica di soglia esatta e risposta a relè reale.

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

`relay: define one threshold rule`

---

## Task successivo

[TASK-130-06](TASK-130-06-evaluate-temperature-in-the-runtime-thread.md) — Valutare la temperatura nel thread Runtime

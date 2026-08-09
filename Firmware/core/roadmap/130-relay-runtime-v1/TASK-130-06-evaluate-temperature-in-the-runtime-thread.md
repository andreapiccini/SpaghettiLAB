# TASK-130-06 — Valutare la temperatura nel thread Runtime

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-130-05](TASK-130-05-define-one-threshold-rule.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Relay ON solo per valori rigorosamente superiori alla soglia.

---

## File da aprire

`subsys/runtime/runtime.c` e `subsys/data/data.c`.

---

## Orientamento Zephyr — k_msgq

1. **Cos’è:** `k_msgq` è una coda Zephyr a capacità e dimensione elemento fisse; copia ogni messaggio nel proprio buffer.
2. **A cosa serve:** Permette a un producer di consegnare dati a un thread consumer senza condividere memoria temporanea.
3. **Quando viene usato:** Il producer inserisce a runtime; il thread Runtime attende o estrae secondo il timeout scelto.
4. **Build-time o runtime:** Runtime.
5. **Collegamento con questo task:** Il message subscriber di zbus usa una coda per consegnare campioni temperatura al thread che valuta la soglia.
6. **File reali coinvolti:** `subsys/runtime/runtime.c` e le dichiarazioni zbus in `subsys/data/data.c`.
7. **Cosa guardare nei file:** Controlla dimensione elemento, profondità, timeout e comportamento quando la coda è piena.
8. **Cosa non modificare:** Non inserire puntatori a stack, non usare una coda non limitata e non comandare il Relay dalla callback zbus.

---

## Cosa scrivere o modificare

Fai ricevere al thread Runtime i messaggi di temperatura tramite un subscriber zbus
basato su coda, oppure tramite il relativo `k_msgq`. Nel thread valuta
`temperature > 25 °C` e chiama il Module Manager soltanto quando lo stato ON/OFF
desiderato cambia.

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

ABBONAMENTO ZBUS + TREAD + DIRECT CALL

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

- [ ] Apri solo `subsys/runtime/runtime.c` e `subsys/data/data.c`.
- [ ] Rendere Runtime consumare messaggi di temperatura attraverso un limitato messaggio
      zbus subscriber o il suo `k_msgq`. Valutare `temperature > 25 °C` in Runtime
      thread e il comando di chiamata diretta Manager solo quando lo stato di relè
      desiderato cambia.
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

`relay: evaluate temperature in the runtime thread`

---

## Task successivo

[TASK-130-07](TASK-130-07-test-the-relay-threshold-and-safe-state.md) — Provare soglia e stato sicuro del Relay

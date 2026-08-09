# TASK-130-07 — Provare soglia e stato sicuro del Relay

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-130-06](TASK-130-06-evaluate-temperature-in-the-runtime-thread.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Relay ON solo per valori rigorosamente superiori alla soglia.

---

## File da aprire

L'hardware Relay reale, l'ingresso di test Runtime e la console seriale.

---

## Cosa scrivere o modificare

Inserisci o produci valori inferiori, uguali e superiori a 25 °C. Verifica il confronto
strettamente maggiore, l'assenza di comandi ripetuti inutilmente, lo stato sicuro durante
`init` e `deinit` e un errore controllato quando il modulo Relay non è disponibile.

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

- [ ] Aprire solo l'hardware relè reale, l'ingresso di test Runtime e la console
      seriale.
- [ ] Inietti o produca valori inferiori, uguali o superiori a 25 °C.
- [ ] Confermare un comportamento più severo, nessun comando ridondante ripetuto, uscita
      init/deinit sicura e un errore controllato quando il modulo Relay non è
      disponibile.
- [ ] Gestisci solo questi errori realistici: Manca target/source, canale sbagliato,
      errore di comando.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Inietti 24.9, 25.0, 25.1 campioni di unità fissa; attenda il comando no/no/one.

---

## Risultato atteso

Solo temperature superiori ai 25 °C comandano il Relay configurato, che ritorna al suo
stato di sicurezza su deinit.

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

`relay: test the relay threshold and safe state`

---

## Task successivo

[TASK-140-01](../140-communication/TASK-140-01-define-bounded-communication-messages.md) — Definire messaggi Communication a dimensione limitata

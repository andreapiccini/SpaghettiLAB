# TASK-140-01 — Definire messaggi Communication a dimensione limitata

**Stato:** ⬜ TODO
**Fase:** 140 — Communication
**Dipende da:** [TASK-130-07](../130-relay-runtime-v1/TASK-130-07-test-the-relay-threshold-and-safe-state.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Versione response/status.

---

## File da aprire

`include/spaghetti/communication.h`.

---

## Cosa scrivere o modificare

Definire i tipi di richiesta e risposta limitati solo per `GET_STATUS` e `SET_CONFIG`.
Rappresentare SET_CONFIG payload come buffer di byte più lunghezza, non campi
analizzati, e definire le dimensioni massime esplicite.

---

## Perché

Config locale funziona e può essere invocato da un ingresso esterno.

---

## Chi usa il risultato

Adattatore di trasporto Shell ora; futuri altri trasporti.

---

## Evento che attiva il codice

RICEZIONE COMUNICAZIONE.

---

## Meccanismo di invocazione

Chiamata diretta dopo la ricezione del trasporto.

---

## Contesto di esecuzione

Communication worker/caller thread.

---

## Chiamate e dipendenze

Contratto Core/Config/decoder.

---

## Input

Comando limitato e carico utile.

---

## Output

Versione response/status.

---

## Errori da gestire

Comando sconosciuto, carico utile sovradimensionato, stato non valido.

---

## Non implementare ancora

- Campi CBOR in Manager, Trasporti BLE/Wi-Fi, OTA

---

## Procedura

- [ ] Apri solo `include/spaghetti/communication.h`.
- [ ] Definire i tipi di richiesta e risposta limitati solo per `GET_STATUS` e
      `SET_CONFIG`. Rappresentare SET_CONFIG payload come buffer di byte più lunghezza,
      non campi analizzati, e definire le dimensioni massime esplicite.
- [ ] Gestisci solo questi errori realistici: comando sconosciuto, payload
      sovradimensionato, stato non valido.
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

Pura richiesta di invio con GET_STATUS.

---

## Risultato atteso

Protocollo API senza trasporto.

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

`communication: define bounded communication messages`

---

## Task successivo

[TASK-140-02](TASK-140-02-declare-and-implement-request-dispatch.md) — Dichiarare e implementare il dispatch delle richieste

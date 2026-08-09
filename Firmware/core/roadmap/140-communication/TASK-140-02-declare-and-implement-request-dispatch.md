# TASK-140-02 — Dichiarare e implementare il dispatch delle richieste

**Stato:** ⬜ TODO
**Fase:** 140 — Communication
**Dipende da:** [TASK-140-01](TASK-140-01-define-bounded-communication-messages.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Versione response/status.

---

## File da aprire

`include/spaghetti/communication.h` e `subsys/communication/communication.c`.

---

## Cosa scrivere o modificare

Dichiarare Communication init e handle-request API più una risposta limitata contratto
return/callback. Implementare l'invio per i segnaposto GET_STATUS e SET_CONFIG con
rigoroso comando, puntatore e convalida della lunghezza.

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

- [ ] Apri solo `include/spaghetti/communication.h` e
      `subsys/communication/communication.c`.
- [ ] Dichiarare Communication init e handle-request API più una risposta limitata
      contratto return/callback.
- [ ] Implementa l'invio per i segnaposto GET_STATUS e SET_CONFIG con severi comandi,
      puntatore e validazione della lunghezza.
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

`communication: declare and implement request dispatch`

---

## Task successivo

[TASK-140-03](TASK-140-03-enable-the-zephyr-shell.md) — Abilitare Zephyr Shell

# TASK-140-06 — Provare stato e input Shell non valido

**Stato:** ⬜ TODO
**Fase:** 140 — Communication
**Dipende da:** [TASK-140-05](TASK-140-05-initialize-communication-from-core.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Risposta allo stato Core/modules/runtime.

---

## File da aprire

La shell seriale USB e la console seriale.

---

## Cosa scrivere o modificare

Eseguire `spaghetti status`, un sottocomando sconosciuto, argomenti mancanti, hex
dispari, hex non valido e un payload sovradimensionato. Confermare lo stato valido
restituisce dati limitati e ogni comando non valido restituisce senza cambiare Config.

---

## Perché

Nessun trasporto USB CDC/BLE/network deve essere inventato.

---

## Chi usa il risultato

Developer/PC via seriale USB.

---

## Evento che attiva il codice

Commandera'/Comunicazione RX.

---

## Meccanismo di invocazione

SHELL COMMAND -> DIRECT CALL.

---

## Contesto di esecuzione

Zephyr shell thread; sicuro per l'analisi delimitata, ma non eseguire un lungo lavoro di
blocco durante la tenuta interna della shell.

---

## Chiamate e dipendenze

Zephyr Shell, Communication Handler, Config/Status.

---

## Input

Prima `spaghetti status`.

---

## Output

Risposta allo stato Core/modules/runtime.

---

## Errori da gestire

Argomenti sbagliati, esadecimale sovradimensionato, Config non disponibile.

---

## Non implementare ancora

- CBOR fino al Passo 15, framing binario, autenticazione

---

## Procedura

- [ ] Aprire solo la shell seriale USB e la console seriale.
- [ ] Eseguire `spaghetti status`, un sottocomando sconosciuto, argomenti mancanti, hex
      dispari, hex non valido e un payload sovradimensionato.
- [ ] Confermare lo stato valido restituisce dati limitati e ogni comando non valido
      restituisce senza modificare Config.
- [ ] Gestisci solo questi errori realistici: Argomenti sbagliati, esagono
      sovradimensionato, Config non disponibile.
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

Dalla console seriale esistente eseguire aiuto, stato valido, comando non valido.

---

## Risultato atteso

La shell USB raggiunge Communication e rifiuta l'ingresso malformato senza effetti
collaterali.

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

`communication: test status and malformed shell input`

---

## Task successivo

[TASK-150-01](../150-cbor/TASK-150-01-document-the-cbor-v0-schema.md) — Documentare lo schema CBOR V0

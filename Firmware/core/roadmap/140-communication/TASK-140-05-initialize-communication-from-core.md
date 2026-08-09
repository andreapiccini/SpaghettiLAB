# TASK-140-05 — Inizializzare Communication da Core

**Stato:** ⬜ TODO
**Fase:** 140 — Communication
**Dipende da:** [TASK-140-04](TASK-140-04-implement-the-shell-transport-adapter.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Risposta allo stato Core/modules/runtime.

---

## File da aprire

`CMakeLists.txt`, `subsys/core/core.c` e `subsys/communication/communication.c`.

---

## Cosa scrivere o modificare

Aggiungi Communication e le sorgenti dell'adattatore di shell a CMake. Inizializza
Communication da Core dopo le dipendenze richieste state/config e propaga gli errori di
inizializzazione.

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

- [ ] Apri solo `CMakeLists.txt`, `subsys/core/core.c` e
      `subsys/communication/communication.c`.
- [ ] Aggiungi Communication e le sorgenti dell'adattatore di shell a CMake. Inizializza
      Communication da Core dopo le dipendenze richieste state/config e propaga gli
      errori di inizializzazione.
- [ ] Gestisci solo questi errori realistici: Argomenti sbagliati, esagono
      sovradimensionato, Config non disponibile.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

NO

---

## Verifica

Dalla console seriale esistente eseguire aiuto, stato valido, comando non valido.

---

## Risultato atteso

Il comando Shell raggiunge il gestore indipendente dal trasporto.

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

`communication: initialize communication from core`

---

## Task successivo

[TASK-140-06](TASK-140-06-test-status-and-malformed-shell-input.md) — Provare stato e input Shell non valido

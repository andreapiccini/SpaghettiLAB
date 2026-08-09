# TASK-140-04 — Implementare l’adattatore di trasporto Shell

**Stato:** ⬜ TODO
**Fase:** 140 — Communication
**Dipende da:** [TASK-140-03](TASK-140-03-enable-the-zephyr-shell.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Risposta allo stato Core/modules/runtime.

---

## File da aprire

Crea `subsys/communication/communication_shell.c`.

---

## Cosa scrivere o modificare

Registrare `spaghetti status` e comandi `spaghetti apply <hex>` limitati. Convalidare il
conteggio degli argomenti, anche la lunghezza esadecimale, la validità del carattere e
decodificare il massimo prima di costruire una richiesta Communication e chiamare
direttamente il gestore.

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

- [ ] Apri solo Crea `subsys/communication/communication_shell.c`.
- [ ] Registrati `spaghetti status` e comandi `spaghetti apply <hex>` limitati.
- [ ] Convalidare il conteggio degli argomenti, anche la lunghezza esadecimale, la
      validità del carattere e decodificare il massimo prima di costruire una richiesta
      Communication e chiamare direttamente il gestore.
- [ ] Gestisci solo questi errori realistici: Argomenti sbagliati, esagono
      sovradimensionato, Config non disponibile.
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

`communication: implement the shell transport adapter`

---

## Task successivo

[TASK-140-05](TASK-140-05-initialize-communication-from-core.md) — Inizializzare Communication da Core

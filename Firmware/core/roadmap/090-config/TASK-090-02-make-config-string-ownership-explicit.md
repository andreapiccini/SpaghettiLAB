# TASK-090-02 — Rendere esplicita la proprietà delle stringhe Config

**Stato:** ⬜ TODO
**Fase:** 090 — Config interna
**Dipende da:** [TASK-090-01](TASK-090-01-define-the-internal-config-model.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Configurazione interna valida.

---

## File da aprire

`include/spaghetti/config.h`.

---

## Cosa scrivere o modificare

Sostituire qualsiasi `const char *type_id` preso in prestito che deve sopravvivere
decode/input con un array di caratteri di proprietà limitata e un nome massimo.

---

## Perché

CBOR deve riempire un modello collaudato, non definire l'architettura.

---

## Chi usa il risultato

Test principale, futuro decoder/Communication, Manager/Runtime.

---

## Evento che attiva il codice

CONFIG COMMAND/BOOT TEST.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread chiamante.

---

## Chiamate e dipendenze

ID Port/module.

---

## Input

Versione, Port 0/SHT40/address, 1000 ms.

---

## Output

Configurazione interna valida.

---

## Errori da gestire

Sbagliato version/count, porta duplicata, tipo vuoto, periodo zero.

---

## Non implementare ancora

- CBOR, MQTT campi, politica di scoperta, unione gigante

---

## Procedura

- [ ] Apri solo `include/spaghetti/config.h`.
- [ ] Sostituire qualsiasi `const char *type_id` preso in prestito che deve sopravvivere
      decode/input con un array di caratteri di proprietà limitata e un massimo di nome.
- [ ] Document snapshot proprietà e le regole di terminazione.
- [ ] Gestisci solo questi errori realistici: Sbagliato version/count, porta duplicata,
      tipo vuoto, periodo zero.
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

Ownership/lifetime recensione per stringhe di tipo e array.

---

## Risultato atteso

Piccola config delimitata.

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

`internal: make config string ownership explicit`

---

## Task successivo

[TASK-090-03](TASK-090-03-implement-config-validation.md) — Implementare la validazione di Config

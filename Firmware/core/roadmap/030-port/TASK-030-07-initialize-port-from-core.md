# TASK-030-07 — Inizializzare Port da Core

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-030-06](TASK-030-06-add-port-to-cmake.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Log equivalente a `Port 0: I2C ready`.

---

## File da aprire

`subsys/core/core.c`.

---

## Cosa scrivere o modificare

Chiama `spaghetti_port_init_all()` da `spaghetti_core_init()`. Propaga un risultato
negativo prima di impostare Core READY. Al successo, registra il conteggio Port e se
Port 0 ha I2C.

---

## Perché

SHT40 non deve essere aggiunto fino a quando Port non segnala il controller reale
pronto.

---

## Chi usa il risultato

Costruisci e Core.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CAMPIONE DEL TEMPO E CHIAMATA DIRETTAMENTE.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

`spaghetti_port_init_all()`, `spaghetti_port_count()`, `spaghetti_port_get()` e
`spaghetti_port_has_capability()`.

---

## Input

Controllore abilitato da Milestone 2.

---

## Output

Log equivalente a `Port 0: I2C ready`.

---

## Errori da gestire

Propaga l'errore negativo Port; non è pronto silenzioso.

---

## Non implementare ancora

- SHT40 o registro

---

## Procedura

- [ ] Apri solo `subsys/core/core.c`.
- [ ] Chiama `spaghetti_port_init_all()` da `spaghetti_core_init()`. Propaga un
      risultato negativo prima di impostare Core READY. Al successo, registra il
      conteggio Port e se Port 0 ha I2C.
- [ ] Gestire solo questi errori realistici: Propagare l'errore negativo Port; nessun
      silent READY.
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

Avviare normalmente, quindi disattivare temporaneamente il controller in un ramo di test
e confermare Port init fallisce; ripristinarlo immediatamente.

---

## Risultato atteso

Trovata una porta; ID non valido restituisce il dispositivo `NULL`; I2C pronto.

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

`port: initialize port from core`

---

## Task successivo

[TASK-030-08](TASK-030-08-test-port-success-and-invalid-ids.md) — Provare Port con ID validi e non validi

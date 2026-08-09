# TASK-030-06 — Aggiungere Port alla build CMake

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-030-05](TASK-030-05-bind-port-0-to-the-i2c-device.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Log equivalente a `Port 0: I2C ready`.

---

## File da aprire

`CMakeLists.txt`.

---

## Cosa scrivere o modificare

Aggiungere `subsys/port/port.c` all'elenco `target_sources(app PRIVATE ...)` esistente.
Non apportare altre modifiche al sistema di compilazione.

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

BUILD-TIME

---

## Contesto di esecuzione

build time

---

## Chiamate e dipendenze

Port init/count/capability.

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

- [ ] Apri solo `CMakeLists.txt`.
- [ ] Aggiungi `subsys/port/port.c` all'elenco `target_sources(app PRIVATE ...)`
      esistente.
- [ ] Non apportare altre modifiche al build-system.
- [ ] Gestire solo questi errori realistici: Propagare l'errore negativo Port; nessun
      silent READY.
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

`port: add port to cmake`

---

## Task successivo

[TASK-030-07](TASK-030-07-initialize-port-from-core.md) — Inizializzare Port da Core

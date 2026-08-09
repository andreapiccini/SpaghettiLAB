# TASK-060-04 — Inizializzare Driver Registry da Core

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry
**Dipende da:** [TASK-060-03](TASK-060-03-validate-registry-entries.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Esattamente il comportamento pointer/null.

---

## File da aprire

`CMakeLists.txt` e `subsys/core/core.c`.

---

## Cosa scrivere o modificare

Aggiungi `subsys/driver_registry/driver_registry.c` alle sorgenti dell'applicazione.
Init registro chiamate da Core dopo l'inizializzazione Port e propaga un risultato
negativo prima che Core diventi READY.

---

## Perché

Il gestore deve ricevere un registro affidabile.

---

## Chi usa il risultato

Core/test.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

API del registro.

---

## Input

Stringe Known/unknown.

---

## Output

Esattamente il comportamento pointer/null.

---

## Errori da gestire

L'errore di init del registro blocca la disponibilità di Core.

---

## Non implementare ancora

- Gestione o configurazione dinamica

---

## Procedura

- [ ] Apri solo `CMakeLists.txt` e `subsys/core/core.c`.
- [ ] Aggiungi `subsys/driver_registry/driver_registry.c` alle sorgenti
      dell'applicazione.
- [ ] Init registro chiamate da Core dopo l'inizializzazione Port e propagare un
      risultato negativo prima che Core diventi READY.
- [ ] Gestisci solo questi errori realistici: l'errore di init del Registry
      blocca la prontezza Core.
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

Osservare il rifiuto noto success/unknown e la lettura continua del sensore.

---

## Risultato atteso

Nessun crash o ripiego per un ID sconosciuto.

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

`driver: initialize the registry from core`

---

## Task successivo

[TASK-060-05](TASK-060-05-test-known-and-unknown-driver-lookup.md) — Provare la ricerca di driver noti e sconosciuti

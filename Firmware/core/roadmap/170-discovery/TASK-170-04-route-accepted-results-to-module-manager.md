# TASK-170-04 — Inviare i risultati accettati al Module Manager

**Stato:** ⬜ TODO
**Fase:** 170 — Discovery
**Dipende da:** [TASK-170-03](TASK-170-03-implement-manual-discovery-validation.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso SHT40 instance/readings.

---

## File da aprire

`subsys/discovery/discovery.c`, `CMakeLists.txt` e `subsys/core/core.c`.

---

## Cosa scrivere o modificare

Implementa una callback che inoltra i risultati accettati all'API di configurazione già
esistente nel Module Manager
immutata. Aggiungi sorgente Discovery a CMake e inizializzalo da Core prima che Config
possa inviare le assegnazioni.

---

## Perché

Il comportamento esistente è un oracolo di regressione.

---

## Chi usa il risultato

Config/Communication -> Discovery -> Manager.

---

## Evento che attiva il codice

COMANDO DI CONFIGURAZIONE.

---

## Meccanismo di invocazione

Catena di CHIAMATE DIRETTE.

---

## Contesto di esecuzione

Config/Communication thread.

---

## Chiamate e dipendenze

Convalida Port e API Manager immutate.

---

## Input

Risultato manuale.

---

## Output

Stesso SHT40 instance/readings.

---

## Errori da gestire

Generazione dello stato, modalità non supportata, propagazione degli errori Manager.

---

## Non implementare ancora

- Async provider worker
- Aggiungi K_WORK solo quando il provider ne ha bisogno

---

## Procedura

- [ ] Apri solo `subsys/discovery/discovery.c`, `CMakeLists.txt` e `subsys/core/core.c`.
- [ ] Implementa una callback che chiama direttamente l'API di configurazione del
      Module Manager
      inalterata.
- [ ] Aggiungi sorgente Discovery a CMake e inizializzala da Core prima che Config possa
      inviare le assegnazioni.
- [ ] Gestisci solo questi errori realistici: Generazione dello stadio, modalità non
      supportata, propagazione degli errori Manager.
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

Applicare la stessa assegnazione CBOR/manual e confrontare status/measurement a prima.

---

## Risultato atteso

Comportamento invariato; Manager non ha conoscenze source/provider.

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

`discovery: route accepted results to module manager`

---

## Task successivo

[TASK-170-05](TASK-170-05-route-config-assignments-through-discovery.md) — Instradare le assegnazioni Config tramite Discovery

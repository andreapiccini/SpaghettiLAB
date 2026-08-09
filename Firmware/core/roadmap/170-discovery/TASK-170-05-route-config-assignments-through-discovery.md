# TASK-170-05 — Instradare le assegnazioni Config tramite Discovery

**Stato:** ⬜ TODO
**Fase:** 170 — Discovery
**Dipende da:** [TASK-170-04](TASK-170-04-route-accepted-results-to-module-manager.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso SHT40 instance/readings.

---

## File da aprire

`subsys/config/config.c`, Communication applicano il percorso e la console seriale.

---

## Cosa scrivere o modificare

Sostituire l'assegnazione diretta del Module Manager Config con un risultato di scoperta
manuale normalizzato. Mantenere Runtime e la configurazione del servizio diretta ai
rispettivi componenti responsabili. Verifica risultati validi, obsoleti, non validi e
con tipo sconosciuto.

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

- [ ] Aprire solo `subsys/config/config.c`, Communication applicare il percorso, e la
      console seriale.
- [ ] Sostituire l'assegnazione diretta del Module Manager Config con un risultato di
      scoperta manuale normalizzato.
- [ ] Mantieni Runtime e la configurazione del servizio diretta ai propri proprietari.
- [ ] Prova risultati validi, obsoleti, non validi e con tipo sconosciuto.
- [ ] Gestisci solo questi errori realistici: Generazione dello stadio, modalità non
      supportata, propagazione degli errori Manager.
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

Applicare la stessa assegnazione CBOR/manual e confrontare status/measurement a prima.

---

## Risultato atteso

La configurazione manuale esistente crea e legge SHT40 mentre Manager rimane
indipendente dal provider.

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

`discovery: route config assignments through discovery`

---

## Task successivo

[TASK-180-01](../180-multi-core/TASK-180-01-define-the-spaghetti-port-binding.md) — Definire il binding Spaghetti Port

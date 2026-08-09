# TASK-170-03 — Implementare la validazione di Discovery manuale

**Stato:** ⬜ TODO
**Fase:** 170 — Discovery
**Dipende da:** [TASK-170-02](TASK-170-02-define-the-discovery-provider-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso SHT40 instance/readings.

---

## File da aprire

`subsys/discovery/discovery.c`.

---

## Cosa scrivere o modificare

Implementa la convalida di invio MANUAL-only per modalità, Port, type/config limiti,
sorgente e generazione. Rifiuta le generazioni obsolete e chiama la callback registrata
solo dopo che il risultato completo valida.

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

- [ ] Apri solo `subsys/discovery/discovery.c`.
- [ ] Implementa la convalida di invio MANUAL per modalità, Port, type/config limiti,
      sorgente e generazione.
- [ ] Rifiuta le generazioni obsolete e chiama la callback registrata solo dopo che il
      risultato completo valida.
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

`discovery: implement manual discovery validation`

---

## Task successivo

[TASK-170-04](TASK-170-04-route-accepted-results-to-module-manager.md) — Inviare i risultati accettati al Module Manager

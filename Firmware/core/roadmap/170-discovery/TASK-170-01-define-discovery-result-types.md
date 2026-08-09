# TASK-170-01 — Definire i tipi risultato di Discovery

**Stato:** ⬜ TODO
**Fase:** 170 — Discovery
**Dipende da:** [TASK-160-08](../160-mqtt/TASK-160-08-move-mqtt-settings-into-config.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Risultato normalizzato.

---

## File da aprire

`include/spaghetti/discovery.h`.

---

## Cosa scrivere o modificare

Definire la modalità MANUAL/AUTO/HYBRID, un enum sorgente indipendente dalla modalità, e
`spaghetti_discovery_result` contenente Port, dati limitati type/config, sorgente e
generazione. Mantenere esplicita la proprietà.

---

## Perché

Il percorso manuale Config/Manager funziona già e diventa il riferimento.

---

## Chi usa il risultato

Communication/Config/manual provider; futuri provider.

---

## Evento che attiva il codice

CONFIG COMMAND/PROVIDER RISULTATO.

---

## Meccanismo di invocazione

Chiamata diretta all'inizio.

---

## Contesto di esecuzione

Communication/Config chiamante thread.

---

## Chiamate e dipendenze

Solo i tipi di valore Port/type/config.

---

## Input

Port 0/SHT40/manual/generation.

---

## Output

Risultato normalizzato.

---

## Errori da gestire

Risultato Invalid/stale/conflicting.

---

## Non implementare ancora

- EEPROM, sonda, trasporto LLM o significato AUTO=EEPROM

---

## Procedura

- [ ] Apri solo `include/spaghetti/discovery.h`.
- [ ] Definire la modalità MANUAL/AUTO/HYBRID, un enum sorgente indipendente dalla
      modalità, e `spaghetti_discovery_result` contenente Port, dati type/config
      limitati, sorgente e generazione.
- [ ] Mantieni esplicita la proprieta'.
- [ ] Gestisci solo questi errori realistici: risultato Invalid/stale/conflicting.
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

Proprietà e revisione della generazione.

---

## Risultato atteso

Risultato neutro del provider.

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

`discovery: define discovery result types`

---

## Task successivo

[TASK-170-02](TASK-170-02-define-the-discovery-provider-api.md) — Definire l’API del provider Discovery

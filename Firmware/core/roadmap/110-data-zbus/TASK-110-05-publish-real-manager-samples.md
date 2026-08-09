# TASK-110-05 — Pubblicare i campioni reali del Manager

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus
**Dipende da:** [TASK-110-04](TASK-110-04-implement-data-initialization-and-publish.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Logger e test subscriber ricevono sequenza identica.

---

## File da aprire

Il sito di acquisizione del gestore e `subsys/data/data.c`.

---

## Cosa scrivere o modificare

Dopo aver letto con successo Manager, costruisci `spaghetti_temperature_sample`,
aggiungi timestamp e sequenza e chiama l'API Data publish. Rimuovi il sensore
diretto-driver; il logger subscriber diventa il proprietario del display.

---

## Perché

Runtime/MQTT deve consumare i dati, non le API SHT40.

---

## Chi usa il risultato

Loop di acquisizione principale temporaneo; subscriber.

---

## Evento che attiva il codice

ARRIVO DATI.

---

## Meccanismo di invocazione

Chiamate poi ZBUS Publish.

---

## Contesto di esecuzione

Thread principale publisher, subscriber.

---

## Chiamate e dipendenze

Manager leggi e pubblichi i dati.

---

## Input

Un vero campione.

---

## Output

Logger e test subscriber ricevono sequenza identica.

---

## Errori da gestire

Leggi il fallimento non pubblica alcun campione valido; pubblica il fallimento
registrato.

---

## Non implementare ancora

- MQTT, streaming PC, routing dati generico

---

## Procedura

- [ ] Aprire solo il sito di acquisizione del gestore e `subsys/data/data.c`.
- [ ] Dopo aver letto con successo Manager, costruisci `spaghetti_temperature_sample`,
      aggiungi timestamp e sequenza e chiama l'API Data publish.
- [ ] Rimuovere la stampa diretta del sensore-driver
- [ ] il logger subscriber diventa il proprietario del display.
- [ ] Gestisci solo questi errori realistici: Il fallimento della lettura non pubblica
      alcun campione valido; pubblica il fallimento registrato.
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

Eseguire per più campioni; verificare la sequenza monotonicamente crescente in entrambi
i consumatori; fermare intenzionalmente un consumatore per testare la politica
pool/backpressure.

---

## Risultato atteso

Ogni campione di prova accettato viene consegnato indipendentemente.

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

`data: publish real manager samples`

---

## Task successivo

[TASK-110-06](TASK-110-06-test-zbus-fan-out-and-backpressure.md) — Provare fan-out e backpressure di zbus

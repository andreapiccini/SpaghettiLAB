# TASK-110-06 — Provare fan-out e backpressure di zbus

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus
**Dipende da:** [TASK-110-05](TASK-110-05-publish-real-manager-samples.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Logger e test subscriber ricevono sequenza identica.

---

## File da aprire

Imbragatura `subsys/data/data.c`, subscriber loops/test e console seriale.

---

## Cosa scrivere o modificare

Ricevere la stessa sequenza in logger e iscritti ai test. Riempire o bloccare un
percorso subscriber limitato deliberatamente e verificare la politica timeout/error
selezionata senza bloccare per sempre.

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

- [ ] Aprire solo l'imbracatura `subsys/data/data.c`, subscriber loops/test e la console
      seriale.
- [ ] Ricevere la stessa sequenza in logger e iscritti ai test. Riempire o bloccare un
      percorso subscriber limitato deliberatamente e verificare la politica
      timeout/error selezionata senza bloccare per sempre.
- [ ] Gestisci solo questi errori realistici: Il fallimento della lettura non pubblica
      alcun campione valido; pubblica il fallimento registrato.
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

Eseguire per più campioni; verificare la sequenza monotonicamente crescente in entrambi
i consumatori; fermare intenzionalmente un consumatore per testare la politica
pool/backpressure.

---

## Risultato atteso

Un campione reale raggiunge due consumatori con sequenza corrispondente e definito
comportamento full-buffer.

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

`data: test zbus fan-out and backpressure`

---

## Task successivo

[TASK-120-01](../120-runtime-v0/TASK-120-01-define-the-runtime-sampling-task-api.md) — Definire l’API del task di campionamento Runtime

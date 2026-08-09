# TASK-110-03 — Definire il canale temperatura e i subscriber

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus
**Dipende da:** [TASK-110-02](TASK-110-02-enable-zbus-message-subscribers.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Copia indipendente per entrambi gli subscriber.

---

## File da aprire

`subsys/data/data.c`.

---

## Cosa scrivere o modificare

Definire `spaghetti_temperature_chan` con `ZBUS_CHAN_DEFINE` e due osservatori
`ZBUS_MSG_SUBSCRIBER_DEFINE`: uno per il logging e uno per il test. Usa il tipo di
campione esatto, un piccolo validatore e un valore iniziale limitato.

---

## Perché

L'automazione Runtime non dovrebbe perdere silenziosamente un campione intermedio.

---

## Chi usa il risultato

Publisher e due thread di consumo di prova.

---

## Evento che attiva il codice

ARRIVO DATI.

---

## Meccanismo di invocazione

Abbonamento al messaggio ZBUS Publish / ZBUS.

---

## Contesto di esecuzione

Publisher thread; thread di prova dedicati ai consumatori.

---

## Chiamate e dipendenze

`zbus_chan_pub`, `zbus_sub_wait_msg`.

---

## Input

Copia del campione.

---

## Output

Copia indipendente per entrambi gli subscriber.

---

## Errori da gestire

Rifiuto del validatore, esaurimento allocation/pool, timeout.

---

## Non implementare ancora

- Consumatori MQTT o Communication

---

## Procedura

- [ ] Apri solo `subsys/data/data.c`.
- [ ] Definire `spaghetti_temperature_chan` con `ZBUS_CHAN_DEFINE` e due osservatori
      `ZBUS_MSG_SUBSCRIBER_DEFINE`: uno per il logging e uno per il test.
- [ ] Utilizzare il tipo di campione esatto, un piccolo validatore e un valore iniziale
      limitato.
- [ ] Gestisci solo questi errori realistici: Rifiuto del validatore, esaurimento
      allocation/pool, timeout.
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

Pubblicare un campione falso; ogni test consumer registra lo stesso sequence/value una
volta.

---

## Risultato atteso

Due ricevute indipendenti.

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

`data: define the temperature channel and subscribers`

---

## Task successivo

[TASK-110-04](TASK-110-04-implement-data-initialization-and-publish.md) — Inizializzare Data e pubblicare un messaggio

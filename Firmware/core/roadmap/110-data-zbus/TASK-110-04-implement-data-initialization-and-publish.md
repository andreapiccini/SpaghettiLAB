# TASK-110-04 — Inizializzare Data e pubblicare un messaggio

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus
**Dipende da:** [TASK-110-03](TASK-110-03-define-the-temperature-channel-and-subscribers.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Copia indipendente per entrambi gli subscriber.

---

## File da aprire

`subsys/data/data.c` e `CMakeLists.txt`.

---

## Cosa scrivere o modificare

Implementa `spaghetti_data_init()` e `spaghetti_data_publish_temperature()` utilizzando
`zbus_chan_pub()` con il timeout fornito dal chiamante. Aggiungi `data.c` a CMake e
propaga gli errori validation/publish.

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

Published ZBUS

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

## Orientamento Zephyr

Il canale copia un messaggio limitato. Non pubblicare un puntatore di stack preso in
prestito per il consumo asincrono.

---

## Procedura

- [ ] Apri solo `subsys/data/data.c` e `CMakeLists.txt`.
- [ ] Implementa `spaghetti_data_init()` e `spaghetti_data_publish_temperature()`
      utilizzando `zbus_chan_pub()` con il timeout fornito dal chiamante.
- [ ] Aggiungere `data.c` a CMake e propagare gli errori validation/publish.
- [ ] Gestisci solo questi errori realistici: Rifiuto del validatore, esaurimento
      allocation/pool, timeout.
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

`data: implement data initialization and publish`

---

## Task successivo

[TASK-110-05](TASK-110-05-publish-real-manager-samples.md) — Pubblicare i campioni reali del Manager

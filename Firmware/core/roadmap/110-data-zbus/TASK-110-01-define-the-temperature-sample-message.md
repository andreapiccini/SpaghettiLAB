# TASK-110-01 — Definire il messaggio del campione di temperatura

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus
**Dipende da:** [TASK-100-06](../100-storage/TASK-100-06-load-config-at-boot-and-test-persistence.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Pubblica lo stato.

---

## File da aprire

`include/spaghetti/data.h`.

---

## Cosa scrivere o modificare

Definisci campi `spaghetti_temperature_sample` immutabili per l'ID del modulo sorgente,
la temperatura a punto fisso o microunità, l'umidità se mantenuta, il timestamp, il
numero di sequenza e i flag che indicano quali dati sono validi. Dichiara le API per
inizializzare Data e pubblicare le
API.

---

## Perché

Un vero sensore funziona; tre futuri consumatori richiedono il disaccoppiamento.

---

## Chi usa il risultato

Pubblica il percorso di acquisizione; logger/Runtime/MQTT/PC consuma.

---

## Evento che attiva il codice

ARRIVO DATI.

---

## Meccanismo di invocazione

Chiamata diretta in dati, poi ZBUS Publish.

---

## Contesto di esecuzione

Acquisition/Runtime thread.

---

## Chiamate e dipendenze

zbus più tardi; API tempo per timestamp.

---

## Input

Valore copiato completo, non impilare mai puntatore all'interno del carico utile.

---

## Output

Pubblica lo stato.

---

## Errori da gestire

Pool source/value non valido e pubblicazione timeout/full.

---

## Non implementare ancora

- Generic variante payload, MQTT topic, head strings

---

## Procedura

- [ ] Apri solo `include/spaghetti/data.h`.
- [ ] Definire campi `spaghetti_temperature_sample` immutabili per l'ID del modulo
      sorgente, la temperatura a punto fisso o microunità, l'umidità se mantenuta, il
      timestamp, il numero di sequenza e i flag di validità.
- [ ] Dichiarare i dati init e limitare pubblicare API.
- [ ] Gestisci solo questi errori realistici: source/value non valido e la pubblicazione
      timeout/full pool.
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

Conferma struttura size/alignment e durata di vita del valore sono limitati.

---

## Risultato atteso

Un contratto preciso con i dati.

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

`data: define the temperature sample message`

---

## Task successivo

[TASK-110-02](TASK-110-02-enable-zbus-message-subscribers.md) — Abilitare i subscriber di zbus

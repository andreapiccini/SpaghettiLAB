# TASK-160-04 — Definire l’API del servizio MQTT

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-03](TASK-160-03-implement-network-readiness-signalling.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un carico fisso.

---

## File da aprire

Crea `subsys/services/mqtt/mqtt.h`.

---

## Cosa scrivere o modificare

Dichiarare le API `spaghetti_mqtt_init()` delimitate, `start()`, `publish_temperature()`
e `get_status()`. Definire gli ingressi endpoint/topic copiati, i limiti di carico e gli
stati di servizio senza esporre Zephyr MQTT interni.

---

## Perché

Rete e dati funzionano in modo indipendente.

---

## Chi usa il risultato

Inizia Core; Pubblica dati subscriber.

---

## Evento che attiva il codice

DATA ARRIVAL/NETWORK EVENT.

---

## Meccanismo di invocazione

ABBONAMENTO ZBUS MSG -> Socket K_MSGQ -> MQTT THREAD ->.

---

## Contesto di esecuzione

Copie di subscriber; MQTT dedicato thread esegue I/O.

---

## Chiamate e dipendenze

API Zephyr MQTT/socket/poll.

---

## Input

Campione di temperatura.

---

## Output

Un carico fisso.

---

## Errori da gestire

Coda piena, disconnessa, errore DNS/connect/publish, conservativo.

---

## Non implementare ancora

- Argomenti dinamici, TLS, matrice QoS, cronologia offline

---

## Procedura

- [ ] Apri solo Crea `subsys/services/mqtt/mqtt.h`.
- [ ] Dichiarare le API `spaghetti_mqtt_init()`, `start()`, `publish_temperature()` e
      `get_status()`.
- [ ] Definisci gli ingressi endpoint/topic copiati, i limiti di carico e gli stati di
      servizio senza esporre gli interni Zephyr MQTT.
- [ ] Gestisci solo questi errori realistici: Coda piena, disconnesso, errore
      DNS/connect/publish, conservativo.
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

Il broker locale subscriber riceve valore; il broker stop/restart e verifica che il
campionamento Runtime continui più le connessioni MQTT.

---

## Risultato atteso

Il campione conosciuto raggiunge l'argomento conosciuto senza bloccare Runtime.

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

`mqtt: define the mqtt service api`

---

## Task successivo

[TASK-160-05](TASK-160-05-implement-the-mqtt-worker-and-client-state.md) — Implementare worker MQTT e stato del client

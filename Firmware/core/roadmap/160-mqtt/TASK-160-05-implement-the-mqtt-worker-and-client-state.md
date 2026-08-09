# TASK-160-05 — Implementare worker MQTT e stato del client

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-04](TASK-160-04-define-the-mqtt-service-api.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un carico fisso.

---

## File da aprire

Creare `subsys/services/mqtt/mqtt.c` e aggiornare `prj.conf`.

---

## Cosa scrivere o modificare

Abilita `CONFIG_MQTT_LIB=y`. Implementa uno MQTT di proprietà thread con buffer client
fissi, elaborazione socket poll/input/live, backoff di connessione e stato
connected/error esplicito. Non bloccare i produttori di dati.

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

- [ ] Aprire solo Crea `subsys/services/mqtt/mqtt.c` e aggiornare `prj.conf`.
- [ ] Abilita `CONFIG_MQTT_LIB=y`.
- [ ] Implementa uno MQTT di proprietà di thread con buffer client fissi, elaborazione
      del socket poll/input/live, backoff di connessione e stato connected/error
      esplicito.
- [ ] Non bloccare i produttori di dati.
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

`mqtt: implement the mqtt worker and client state`

---

## Task successivo

[TASK-160-06](TASK-160-06-queue-temperature-for-a-fixed-development-topic.md) — Accodare la temperatura per un topic di sviluppo

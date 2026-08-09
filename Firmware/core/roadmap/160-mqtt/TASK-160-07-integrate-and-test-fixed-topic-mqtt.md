# TASK-160-07 — Integrare e provare MQTT con topic fisso

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-06](TASK-160-06-queue-temperature-for-a-fixed-development-topic.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un carico fisso.

---

## File da aprire

`CMakeLists.txt`, `subsys/core/core.c`, MQTT e il broker di sviluppo.

---

## Cosa scrivere o modificare

Aggiungere le sorgenti MQTT a CMake, initialize/start il servizio dopo la preparazione
della rete, e osservare un argomento di temperatura presso il broker. L'assenza del
broker di prova, riconnettersi, e una coda completa in uscita con la politica
documentata.

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

- [ ] Apri solo file di servizio `CMakeLists.txt`, `subsys/core/core.c`, MQTT e il
      broker di sviluppo.
- [ ] Aggiungere le sorgenti MQTT a CMake, initialize/start il servizio dopo la
      disponibilità della rete, e osservare un argomento di temperatura presso il
      broker.
- [ ] Test broker assenza, riconnettersi, e una coda piena in uscita con la politica
      documentata.
- [ ] Gestisci solo questi errori realistici: Coda piena, disconnesso, errore
      DNS/connect/publish, conservativo.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Il broker locale subscriber riceve valore; il broker stop/restart e verifica che il
campionamento Runtime continui più le connessioni MQTT.

---

## Risultato atteso

Una temperatura reale raggiunge l'argomento di sviluppo fisso e il comportamento di
riconnettersi è limitato.

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

`mqtt: integrate and test fixed-topic mqtt`

---

## Task successivo

[TASK-160-08](TASK-160-08-move-mqtt-settings-into-config.md) — Spostare le impostazioni MQTT in Config

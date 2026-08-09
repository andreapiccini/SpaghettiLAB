# TASK-160-06 — Accodare la temperatura per un topic di sviluppo

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-05](TASK-160-05-implement-the-mqtt-worker-and-client-state.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un carico fisso.

---

## File da aprire

`subsys/services/mqtt/mqtt.c` e `subsys/data/data.c`.

---

## Cosa scrivere o modificare

Crea uno `k_msgq` in uscita limitato. Crea MQTT subscriber format/copy carico di una
temperatura e enqueue con una politica nonblocking/full definita. Pubblicalo su un
argomento di sviluppo fisso dalla MQTT thread.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> La broker/topic fissa è intenzionalmente temporanea e verrà rimossa in
  [TASK-160-08](TASK-160-08-move-mqtt-settings-into-config.md).


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

ABBONAMENTO ZBUS + K_MSGQ + THREAD

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

## Orientamento Zephyr

La message queue disaccoppia il consumo di zbus dal lavoro in socket. La connessione
MQTT e l'elaborazione delle pubblicazioni appartengono alla thread, non ad una callback
zbus.

---

## Procedura

- [ ] Apri solo `subsys/services/mqtt/mqtt.c` e `subsys/data/data.c`.
- [ ] Crea uno `k_msgq` in uscita limitato.
- [ ] Rendere data's MQTT subscriber format/copy un carico di temperatura e enqueue con
      una politica nonblocking/full definita. Pubblicarlo a un argomento di sviluppo
      fisso dalla MQTT thread.
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

`mqtt: queue temperature for a fixed development topic`

---

## Task successivo

[TASK-160-07](TASK-160-07-integrate-and-test-fixed-topic-mqtt.md) — Integrare e provare MQTT con topic fisso

# TASK-160-03 — Implementare la segnalazione di rete pronta

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-02](TASK-160-02-enable-the-minimum-network-kconfig.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Evento e registro indirizzi IP-ready.

---

## File da aprire

La sorgente dell'adattatore di rete sotto `subsys/services/mqtt/`.

---

## Cosa scrivere o modificare

Registrare i callback necessari per la gestione della rete, tracciare lo stato link/IP e
segnalare il futuro MQTT worker solo dopo `NET_EVENT_IPV4_ADDR_ADD` o l'equivalente
scelto.

---

## Perché

Data funziona e MQTT è il prossimo consumatore esterno.

---

## Chi usa il risultato

Servizio MQTT.

---

## Evento che attiva il codice

BOOT/NETWORK EVENT.

---

## Meccanismo di invocazione

CALLBACK -> K_SEM o K_MSGQ -> THREAD.

---

## Contesto di esecuzione

Segnali di chiamata netta; MQTT/network worker esegue il lavoro.

---

## Chiamate e dipendenze

API di gestione Zephyr Wi-Fi/net.

---

## Input

Credenziali forniti da configurazione di sviluppo controllata, non segreti commessi.

---

## Output

Evento e registro indirizzi IP-ready.

---

## Errori da gestire

Auth, associazione, DHCP, DNS, disconnect/retry.

---

## Non implementare ancora

- MQTT, TLS, storage credenziale di produzione

---

## Procedura

- [ ] Aprire solo la sorgente dell'adattatore di rete sotto `subsys/services/mqtt/`.
- [ ] Registrare i callback necessari per la gestione della rete, tracciare lo stato
      link/IP e segnalare il futuro MQTT worker solo dopo `NET_EVENT_IPV4_ADDR_ADD` o
      l'equivalente scelto.
- [ ] Gestisci solo questi errori realistici: Auth, associazione, DHCP, DNS,
      disconnect/retry.
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

Collegare, ottenere IP, disconnettere AP, osservare limitato retry/status.

---

## Risultato atteso

Il segnale pronto per la rete è affidabile.

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

`mqtt: implement network readiness signalling`

---

## Task successivo

[TASK-160-04](TASK-160-04-define-the-mqtt-service-api.md) — Definire l’API del servizio MQTT

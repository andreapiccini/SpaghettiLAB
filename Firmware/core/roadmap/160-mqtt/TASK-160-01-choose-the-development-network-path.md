# TASK-160-01 — Scegliere il percorso di rete per lo sviluppo

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-150-06](../150-cbor/TASK-150-06-test-valid-and-invalid-cbor-payloads.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Evento e registro indirizzi IP-ready.

---

## File da aprire

L'ambiente di rete target, l'endpoint broker, la origine delle credenziali e
`subsys/services/mqtt/README.md`.

---

## Cosa scrivere o modificare

Registrare se il test utilizza Wi-Fi, DHCP o IPv4, indirizzo DNS o broker numerico, e
come vengono fornite le credenziali di sviluppo senza commettere segreti. Non modificare
il firmware in questo task, che serve soltanto a documentare la decisione.

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

DECISIONE RICHIESTA

---

## Contesto di esecuzione

N/A

---

## Chiamate e dipendenze

Nessuno

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

- Codice protocollo MQTT, provisioning di produzione, TLS o credenziali impegnate

---

## Procedura

- [ ] Apri solo L'ambiente di rete di destinazione, l'endpoint broker, la fonte
      credenziale e `subsys/services/mqtt/README.md`.
- [ ] Registrare se il test utilizza Wi-Fi, DHCP o IPv4, DNS o indirizzo di broker
      numerico, e come vengono fornite le credenziali di sviluppo senza commettere
      segreti.
- [ ] Non modificare il firmware in questo task di decisione.
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

`mqtt: choose the development network path`

---

## Task successivo

[TASK-160-02](TASK-160-02-enable-the-minimum-network-kconfig.md) — Abilitare la configurazione di rete minima

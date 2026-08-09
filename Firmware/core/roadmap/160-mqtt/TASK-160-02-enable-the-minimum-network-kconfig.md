# TASK-160-02 — Abilitare la configurazione di rete minima

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-01](TASK-160-01-choose-the-development-network-path.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Evento e registro indirizzi IP-ready.

---

## File da aprire

`prj.conf`.

---

## Orientamento Zephyr — stack di rete Zephyr

1. **Cos’è:** Lo stack di rete Zephyr comprende interfaccia, gestione eventi, IPv4, TCP, socket e servizi opzionali come DHCP e DNS.
2. **A cosa serve:** Fornisce a MQTT una connessione IP senza incorporare dettagli del driver Wi-Fi nel servizio MQTT.
3. **Quando viene usato:** Kconfig include i sottosistemi durante la build; interfaccia, indirizzo e socket diventano utilizzabili a runtime dopo gli eventi corretti.
4. **Build-time o runtime:** Selezione a build-time, connettività a runtime.
5. **Collegamento con questo task:** Il percorso di rete scelto nel task precedente determina quali sole opzioni devono essere abilitate.
6. **File reali coinvolti:** `prj.conf`; per capire le dipendenze usa l’help Kconfig della versione Zephyr installata.
7. **Cosa guardare nei file:** Verifica opzioni per interfaccia ESP32, networking, IPv4, TCP, socket e soltanto i servizi realmente necessari.
8. **Cosa non modificare:** Non copiare una configurazione di esempio completa, non inserire credenziali nel repository e non considerare `CONFIG_*=y` prova di connessione.

---

## Cosa scrivere o modificare

Abilitare le opzioni di rete ESP32 installate richieste dal percorso scelto: Wi-Fi,
rete, IPv4, TCP, socket, rete management/events e DHCP/DNS solo se necessario. Risolvere
solo autentiche dipendenze Kconfig.

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

- [ ] Apri solo `prj.conf`.
- [ ] Abilitare le opzioni di rete ESP32 installate richieste dal percorso scelto:
      Wi-Fi, rete, IPv4, TCP, socket, rete management/events e DHCP/DNS solo se
      necessario. Risolvere solo autentiche dipendenze Kconfig.
- [ ] Gestisci solo questi errori realistici: Auth, associazione, DHCP, DNS,
      disconnect/retry.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

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

`mqtt: enable the minimum network kconfig`

---

## Task successivo

[TASK-160-03](TASK-160-03-implement-network-readiness-signalling.md) — Implementare la segnalazione di rete pronta

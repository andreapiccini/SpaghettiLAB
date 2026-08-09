# TASK-160-08 — Spostare le impostazioni MQTT in Config

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT
**Dipende da:** [TASK-160-07](TASK-160-07-integrate-and-test-fixed-topic-mqtt.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Pubblica per configurare l'argomento.

---

## File da aprire

`include/spaghetti/config.h`, `subsys/config/config.c`, i file di servizio CBOR
schema/codec e MQTT.

---

## Cosa scrivere o modificare

Aggiungi a Config solo flag, endpoint broker delimitato, porta e argomento base
delimitato. Bump e valida la versione schema CBOR, passa una configurazione MQTT copiata
attraverso la sua API, ed elimina ogni costante endpoint/topic fissa.

---

## Perché

Il percorso a tema fisso è provato.

---

## Chi usa il risultato

Config si applica al servizio MQTT.

---

## Evento che attiva il codice

COMANDO DI CONFIGURAZIONE.

---

## Meccanismo di invocazione

DIRECT CALL o comando MQTT K_MSGQ per la riconnessione dal vivo.

---

## Contesto di esecuzione

Il chiamante Config invia; MQTT thread si riconnette.

---

## Chiamate e dipendenze

Servizio Codec/Config/MQTT.

---

## Input

Valida limitata endpoint/topic.

---

## Output

Pubblica per configurare l'argomento.

---

## Errori da gestire

Non valido host/port/topic e non riuscita riconfigurazione in diretta.

---

## Non implementare ancora

- Segreti interni normali Config o OTA sopra MQTT

---

## Procedura

- [ ] Apri solo `include/spaghetti/config.h`, `subsys/config/config.c`, i file di
      servizio CBOR schema/codec e MQTT.
- [ ] Aggiungi a Config solo flag, endpoint broker delimitato, porta e argomento base
      delimitato. Bump e valida la versione schema CBOR, passa una configurazione MQTT
      copiata attraverso la sua API, ed elimina ogni costante endpoint/topic fissa.
- [ ] Gestisci solo questi errori realistici: non valido host/port/topic e non riuscita
      riconfigurazione dal vivo.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Distribuire un secondo argomento e confermare il prossimo campione appare lì.

---

## Risultato atteso

La configurazione endpoint/topic raggiunge il broker e non rimane alcuna impostazione di
sviluppo fisso MQTT.

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

`mqtt: move mqtt settings into config`

---

## Task successivo

[TASK-170-01](../170-discovery/TASK-170-01-define-discovery-result-types.md) — Definire i tipi risultato di Discovery

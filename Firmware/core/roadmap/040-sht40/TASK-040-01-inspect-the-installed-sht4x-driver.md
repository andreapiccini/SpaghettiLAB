# TASK-040-01 — Esaminare il driver SHT4x fornito da Zephyr

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-030-08](../030-port/TASK-030-08-test-port-success-and-invalid-ids.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Piano deliberato temporary/static.

---

## File da aprire

File Zephyr installati all'interno di `make shell`: `drivers/sensor/sensirion/sht4x/`,
`dts/bindings/sensor/sensirion,sht4x.yaml` e `samples/sensor/sht4x/`.

---

## Cosa scrivere o modificare

Ispezionare le driver installate, binding e il campione. Confermare la stringa
compatibile, richiesta `repeatability`, i nomi dei canali e le aspettative di indirizzo.
Registrare la decisione di utilizzare la Zephyr statico driver solo per portare-up; non
cambiare i file di produzione.

---

## Perché

L'ambiente installato ha già il supporto `CONFIG_SHT4X`, `sensirion,sht4x` e Sensor API.

---

## Chi usa il risultato

Taglia verticale SHT40.

---

## Evento che attiva il codice

DECISIONE DI DESIGN.

---

## Meccanismo di invocazione

DISPOSITIVO STATICO BUILD-TIME per OPZIONE A.

---

## Contesto di esecuzione

Revisione degli sviluppatori.

---

## Chiamate e dipendenze

Modello Zephyr Device/Sensor/I2C.

---

## Input

Modulo di cablaggio confermato e indirizzo.

---

## Output

Piano deliberato temporary/static.

---

## Errori da gestire

Se il modulo reale non è compatibile con SHT4x, fermati.

---

## Non implementare ancora

- Direct-I2C protocollo o operazioni del modulo generico

---

## Orientamento Zephyr

L'API del sensore Zephyr richiede un dispositivo staticamente istanziato Devicetree. Ciò
è accettabile per il lancio ma non per il modello finale del modulo rimovibile.

---

## Procedura

- [ ] Aprire solo i file Zephyr installati all'interno di `make shell`:
`drivers/sensor/sensirion/sht4x/`, `dts/bindings/sensor/sensirion,sht4x.yaml` e
`samples/sensor/sht4x/`.
- [ ] Ispezionare la driver installata, binding e il campione.
- [ ] Conferma stringa compatibile, richiesta `repeatability`, nomi dei canali e
      indirizzo aspettative.
- [ ] Registrare la decisione di utilizzare il Zephyr statico driver solo per portare-up
- [ ] non modificare i file di produzione.
- [ ] Gestisci solo questi errori realistici: se il modulo reale non è compatibile con
      SHT4x, fermati.
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

Confermare installato binding richiede `repeatability` e I2C indirizzo.

---

## Risultato atteso

Nessuna ambiguità sul motivo per cui il nodo statico è temporaneo.

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

`sht40: inspect the installed sht4x driver`

---

## Task successivo

[TASK-040-02](TASK-040-02-add-the-temporary-sht40-devicetree-node.md) — Aggiungere il nodo Devicetree temporaneo di SHT40

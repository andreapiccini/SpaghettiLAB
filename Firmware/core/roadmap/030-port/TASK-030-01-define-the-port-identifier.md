# TASK-030-01 — Definire l’identificatore di Port

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-020-06](../020-board-i2c/TASK-020-06-flash-the-i2c-baseline.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Puntatore Port o `NULL`; Puntatore boolean/device.

---

## File da aprire

`include/spaghetti/port.h`.

---

## Cosa scrivere o modificare

Aggiungi una protezione di inclusione e lo standard minimo include, quindi definisci
`typedef uint8_t spaghetti_port_id_t;`. Non esporre un tipo ESP32 o un numero GPIO.

---

## Perché

Il codice SHT40 ha bisogno di un'astrazione verificata immediatamente.

---

## Chi usa il risultato

Core, SHT40 test driver; successivamente Manager.

---

## Evento che attiva il codice

Funzionamento BOOT/LOOKUP/MODULE.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale o thread chiamante.

---

## Chiamate e dipendenze

Dichiarazione Zephyr `struct device` e tipi di base.

---

## Input

Port ID/capability.

---

## Output

Puntatore Port o `NULL`; Puntatore boolean/device.

---

## Errori da gestire

ID/null port/not inizializzato.

---

## Non implementare ancora

- SPI/GPIO/power, occupazione moduli, allocazione dinamica

---

## Procedura

- [ ] Apri solo `include/spaghetti/port.h`.
- [ ] Aggiungi una protezione include e lo standard minimo include, quindi definisci
      `typedef uint8_t spaghetti_port_id_t;`.
- [ ] Non esporre un tipo ESP32 o un numero GPIO.
- [ ] Gestisci solo questi errori realistici: inizializzato ID/null port/not non valido.
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

Confermare che nessun identificativo ESP32 o pin è pubblico.

---

## Risultato atteso

Piccola API sufficiente per una fetta verticale I2C.

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

`port: define the port identifier`

---

## Task successivo

[TASK-030-02](TASK-030-02-define-port-capabilities.md) — Definire le capacità di Port

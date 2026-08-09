# TASK-030-02 — Definire le capacità di Port

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-030-01](TASK-030-01-define-the-port-identifier.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un bit di capacità I2C.

---

## File da aprire

`include/spaghetti/port.h`.

---

## Cosa scrivere o modificare

Definire `enum spaghetti_port_capability` con solo `SPAGHETTI_PORT_CAP_I2C = BIT(0)`.
Aggiungere solo l'inclusione richiesta per `BIT()`.

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

Nessun input runtime; si tratta di un contratto pubblico di compilazione.

---

## Output

Un bit di capacità I2C.

---

## Errori da gestire

ID/null port/not inizializzato.

---

## Non implementare ancora

- SPI/GPIO/power, occupazione moduli, allocazione dinamica

---

## Procedura

- [ ] Apri solo `include/spaghetti/port.h`.
- [ ] Definire `enum spaghetti_port_capability` con solo `SPAGHETTI_PORT_CAP_I2C =
      BIT(0)`.
- [ ] Aggiungere solo l'inclusione richiesta per `BIT()`.
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

`port: define port capabilities`

---

## Task successivo

[TASK-030-03](TASK-030-03-declare-the-port-public-api.md) — Dichiarare l’API pubblica di Port

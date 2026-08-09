# TASK-090-01 — Definire il modello interno di Config

**Stato:** ⬜ TODO
**Fase:** 090 — Config interna
**Dipende da:** [TASK-080-06](../080-runtime-removable-sht40/TASK-080-06-regression-test-the-runtime-sht40.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Configurazione interna valida.

---

## File da aprire

`include/spaghetti/config.h`.

---

## Cosa scrivere o modificare

Definire limiti di capacità fissi più `spaghetti_module_config`,
`spaghetti_runtime_sampling_config`, `spaghetti_config` e `spaghetti_config` con solo
versione, assegnazioni di moduli limitate, indirizzo I2C verificato, e un periodo di
campionamento. Dichiarare convalidare e applicare API.

---

## Perché

CBOR deve riempire un modello collaudato, non definire l'architettura.

---

## Chi usa il risultato

Test principale, futuro decoder/Communication, Manager/Runtime.

---

## Evento che attiva il codice

CONFIG COMMAND/BOOT TEST.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread chiamante.

---

## Chiamate e dipendenze

ID Port/module.

---

## Input

Versione, Port 0/SHT40/address, 1000 ms.

---

## Output

Configurazione interna valida.

---

## Errori da gestire

Sbagliato version/count, porta duplicata, tipo vuoto, periodo zero.

---

## Non implementare ancora

- CBOR, MQTT campi, politica di scoperta, unione gigante

---

## Procedura

- [ ] Apri solo `include/spaghetti/config.h`.
- [ ] Definire limiti di capacità fissi più `spaghetti_module_config`,
      `spaghetti_runtime_sampling_config` e `spaghetti_config` con una sola versione,
      assegnazioni di moduli limitate, indirizzo I2C verificato e un periodo di
      campionamento.
- [ ] Dichiarare convalida e applicare API.
- [ ] Gestisci solo questi errori realistici: Sbagliato version/count, porta duplicata,
      tipo vuoto, periodo zero.
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

Ownership/lifetime recensione per stringhe di tipo e array.

---

## Risultato atteso

Piccola config delimitata.

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

`internal: define the internal config model`

---

## Task successivo

[TASK-090-02](TASK-090-02-make-config-string-ownership-explicit.md) — Rendere esplicita la proprietà delle stringhe Config

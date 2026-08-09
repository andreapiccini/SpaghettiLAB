# TASK-050-03 — Definire la tabella operazioni di Module Driver

**Stato:** ⬜ TODO
**Fase:** 050 — Module + Module Driver
**Dipende da:** [TASK-050-02](TASK-050-02-define-the-temporary-sample-contract.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

`0` o negativo errno.

---

## File da aprire

`include/spaghetti/module_driver.h`.

---

## Cosa scrivere o modificare

Definire puntatori `spaghetti_module_driver_ops` con campi sincroni `init`, `read` e
`deinit`. Definire i campi `spaghetti_module_driver` immutabili `type_id`,
`required_capabilities` e `ops`. Modulo e tipi di campioni in avanti, invece di creare
include ciclici.

---

## Perché

SHT40 deve dimostrare la tabella delle operazioni prima dell'esistenza del Registro.

---

## Chi usa il risultato

Implementazione SHT40 e futuro Manager.

---

## Evento che attiva il codice

MODULO LIFECYCLE/READ.

---

## Meccanismo di invocazione

INVITARE DIRECT through function pointers.

---

## Contesto di esecuzione

Thread chiamante.

---

## Chiamate e dipendenze

Modulo e tipi di capacità Port.

---

## Input

Puntatore del modulo e uscita del campione.

---

## Output

`0` o negativo errno.

---

## Errori da gestire

Null ops/module, capacità non supportata, guasto I/O.

---

## Non implementare ancora

- Command/configure/probe/power callback o versione ABI

---

## Procedura

- [ ] Apri solo `include/spaghetti/module_driver.h`.
- [ ] Definire `spaghetti_module_driver_ops` con puntatori sincroni `init`, `read` e
      `deinit`.
- [ ] Definisci i campi `spaghetti_module_driver` immutabili `type_id`,
      `required_capabilities` e `ops`. Modulo e tipi di campionamento in avanti invece
      di creare include ciclici.
- [ ] Gestisci solo questi errori realistici: Null ops/module, funzionalità non
      supportata, errore I/O.
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

Verificare che driver non possiede l'istanza del modulo.

---

## Risultato atteso

Solo contratto di tre operazioni.

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

`module: define the module-driver operation table`

---

## Task successivo

[TASK-050-04](TASK-050-04-declare-the-sht40-driver-descriptor.md) — Dichiarare il descrittore del driver SHT40

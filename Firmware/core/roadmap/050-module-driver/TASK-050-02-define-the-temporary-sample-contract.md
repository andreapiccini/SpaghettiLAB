# TASK-050-02 — Definire il contratto temporaneo del campione

**Stato:** ⬜ TODO
**Fase:** 050 — Module + Module Driver
**Dipende da:** [TASK-050-01](TASK-050-01-define-the-minimal-module-instance.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Un valore di campione limitato che può attraversare la tabella di funzionamento driver.

---

## File da aprire

`include/spaghetti/data.h` o `include/spaghetti/module_driver.h`, scegliendo una
posizione e documentandola.

---

## Cosa scrivere o modificare

Definire solo i campi di temperatura e umidità necessari dall'attuale SHT40 letto come
`struct spaghetti_sample`. Non aggiungere canali generalizzati, mappe dei metadati o
payload di proprietà.

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

Un valore di campione limitato che può attraversare la tabella di funzionamento driver.

---

## Errori da gestire

Null ops/module, capacità non supportata, guasto I/O.

---

## Non implementare ancora

- Command/configure/probe/power callback o versione ABI

---

## Procedura

- [ ] Aprire solo `include/spaghetti/data.h` o `include/spaghetti/module_driver.h`,
      scegliendo una posizione e documentandola.
- [ ] Definire solo i campi di temperatura e umidità necessari per l'attuale SHT40 letto
      come `struct spaghetti_sample`.
- [ ] Non aggiungere canali generalizzati, mappe dei metadati o payload di proprietà.
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

`module: define the temporary sample contract`

---

## Task successivo

[TASK-050-03](TASK-050-03-define-the-module-driver-operation-table.md) — Definire la tabella operazioni di Module Driver

# TASK-070-05 — Integrare Manager con Core e main

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager
**Dipende da:** [TASK-070-04](TASK-070-04-implement-manager-read.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Intest READY e valori.

---

## File da aprire

`CMakeLists.txt`, `subsys/core/core.c` e `src/main.c`.

---

## Cosa scrivere o modificare

Aggiungi sorgente Manager a CMake. Inizializzala da Core dopo il Registro. In `main`,
rimuovi l'oggetto principale del modulo, configura Port 0 come `sht40`, mantieni l'ID
del modulo restituito e leggi solo tramite Manager.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> L'assegnazione hardcoded Port 0/SHT40 è intenzionalmente temporanea e verrà rimossa in
  [TASK-090-05](../090-config/TASK-090-05-add-and-apply-one-hardcoded-c-config.md).


---

## Perché

Config interna può successivamente chiamare esattamente questa API Manager.

---

## Chi usa il risultato

Test principale.

---

## Evento che attiva il codice

BOOT/PERIODIC LOOP.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Module Manager -> Registro -> driver -> sensore statico di corrente.

---

## Input

Port 0, `sht40`.

---

## Output

Intest READY e valori.

---

## Errori da gestire

Log exact configure/read errno.

---

## Non implementare ancora

- Struttura Config o CBOR

---

## Procedura

- [ ] Apri solo `CMakeLists.txt`, `subsys/core/core.c` e `src/main.c`.
- [ ] Aggiungi sorgente Manager a CMake. Inizializzala da Core dopo il Registro. In
      `main`, rimuovi l'oggetto principale del modulo, configura Port 0 come `sht40`,
      mantieni l'ID del modulo restituito e leggi solo tramite Manager.
- [ ] Gestisci solo questi errori realistici: Log exact configure/read errno.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

NO

---

## Verifica

Richiedi anche tipo sconosciuto e occupato Port in test controllato, quindi ripristina
il percorso valido.

---

## Risultato atteso

I valori reali ora passano attraverso Manager.

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

`module: integrate manager into core and main`

---

## Task successivo

[TASK-070-06](TASK-070-06-test-manager-success-and-rollback.md) — Provare successo e rollback del Manager

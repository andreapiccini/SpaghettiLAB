# TASK-130-02 — Implementare ciclo di vita e comando sicuro del Relay

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-130-01](TASK-130-01-define-the-relay-command-contract.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Applicato state/status.

---

## File da aprire

`spaghetti_modules/relay/relay.c` e le API Port/GPIO verificate.

---

## Cosa scrivere o modificare

Implementa `init` in modo che il relè assuma subito lo stato sicuro verificato.
Implementa il comando ON/OFF e fai in modo che `deinit` ripristini lo stato sicuro.
Accedi all'hardware tramite Port, senza numeri GPIO specifici della scheda, e propaga
gli errori hardware reali.

---

## Perché

Runtime V1 ha bisogno di un target testato.

---

## Chi usa il risultato

Manager routing di comando.

---

## Evento che attiva il codice

MODULO CONFIGURATION/USER ACTION.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Manager/Runtime thread.

---

## Chiamate e dipendenze

Real Port API e Zephyr GPIO/other hanno verificato la periferica.

---

## Input

Logica ON/OFF.

---

## Output

Applicato state/status.

---

## Errori da gestire

Port non supportato, comando non valido, guasto hardware.

---

## Non implementare ancora

- Inventare il comportamento pin/active level/latching
- schema d'uso

---

## Procedura

- [ ] Aprire solo `spaghetti_modules/relay/relay.c` e le API Port/GPIO verificate.
- [ ] Implementare init relè per stabilire lo stato sicuro verificato, il comando per
      impostare un'uscita booleana, e deinit per ripristinare lo stato sicuro.
- [ ] Utilizzare Port piuttosto che la scheda GPIO costanti e propagare errori hardware
      reali.
- [ ] Gestisci solo questi errori realistici: Port non supportato, comando non valido,
      guasto hardware.
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

Configurazione manuale Manager e OFF->ON->OFF; verifica elettricamente e sul log.

---

## Risultato atteso

Lo stato logico controlla in sicurezza sia il Relay reale sia il backend finto.

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

`relay: implement safe relay lifecycle and set`

---

## Task successivo

[TASK-130-03](TASK-130-03-register-and-build-the-relay-driver.md) — Registrare e compilare il driver Relay

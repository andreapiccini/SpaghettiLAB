# TASK-130-01 — Definire il contratto dei comandi Relay

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-120-06](../120-runtime-v0/TASK-120-06-remove-the-sampling-loop-from-main-and-test-cadence.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Applicato state/status.

---

## File da aprire

`spaghetti_modules/relay/relay.h` e `include/spaghetti/module_driver.h`.

---

## Cosa scrivere o modificare

Aggiungi alla tabella delle operazioni del driver soltanto
`command(module, command, value)`, necessaria per impostare un valore booleano. Definisci
i tipi minimi per comando e valore del relè. Polarità e configurazione hardware restano
private nel driver e devono riferirsi a una capacità reale della Port.

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

- [ ] Apri solo `spaghetti_modules/relay/relay.h` e `include/spaghetti/module_driver.h`.
- [ ] Aggiungere solo l'operazione driver `command(module, command, value)` necessaria
      per un SET booleano logico.
- [ ] Definire i tipi minimi di relè command/value e una configurazione di relè privata
      legata a una reale capacità Port.
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

`relay: define the relay command contract`

---

## Task successivo

[TASK-130-02](TASK-130-02-implement-safe-relay-lifecycle-and-set.md) — Implementare ciclo di vita e comando sicuro del Relay

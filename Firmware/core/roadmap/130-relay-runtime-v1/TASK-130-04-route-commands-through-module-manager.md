# TASK-130-04 — Instradare i comandi tramite Module Manager

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-130-03](TASK-130-03-register-and-build-the-relay-driver.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Applicato state/status.

---

## File da aprire

`include/spaghetti/module_manager.h` e `subsys/module_manager/module_manager.c`.

---

## Cosa scrivere o modificare

Dichiara e implementa `spaghetti_module_manager_command()`. Prima di chiamare il driver,
verifica l'ID del modulo, lo stato READY, il supporto dell'operazione e la validità del
valore. Aggiungi il modulo Relay alla configurazione di test usando soltanto hardware
già verificato.

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

- [ ] Apri solo `include/spaghetti/module_manager.h` e
      `subsys/module_manager/module_manager.c`.
- [ ] Dichiarare e implementare `spaghetti_module_manager_command()`.
- [ ] Convalida l'ID, lo stato pronto, il supporto di comando e il valore prima di una
      chiamata diretta driver.
- [ ] Aggiungere il modulo Relay alla configurazione di test corrente utilizzando
      l'hardware verificato.
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

`relay: route commands through module manager`

---

## Task successivo

[TASK-130-05](TASK-130-05-define-one-threshold-rule.md) — Definire una regola di soglia

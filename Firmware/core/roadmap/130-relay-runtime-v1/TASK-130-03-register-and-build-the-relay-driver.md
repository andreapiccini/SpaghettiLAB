# TASK-130-03 — Registrare e compilare il driver Relay

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1
**Dipende da:** [TASK-130-02](TASK-130-02-implement-safe-relay-lifecycle-and-set.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Applicato state/status.

---

## File da aprire

`subsys/driver_registry/driver_registry.c` e `CMakeLists.txt`.

---

## Cosa scrivere o modificare

Aggiungi il descrittore immutabile del driver Relay al Registry e includi il relativo
sorgente in CMake. Estendi i controlli del Registry per rilevare duplicati e operazioni
mancanti nel percorso dei comandi, senza ridurre i controlli già previsti per SHT40.

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

- [ ] Apri solo `subsys/driver_registry/driver_registry.c` e `CMakeLists.txt`.
- [ ] Aggiungere il descrittore Relay immutabile al Registry fisso e alla sua
      sorgente a CMake. Estendere la convalida duplicate/operation per il percorso di
      comando senza indebolire i requisiti SHT40.
- [ ] Gestisci solo questi errori realistici: Port non supportato, comando non valido,
      guasto hardware.
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

`relay: register and build the relay driver`

---

## Task successivo

[TASK-130-04](TASK-130-04-route-commands-through-module-manager.md) — Instradare i comandi tramite Module Manager

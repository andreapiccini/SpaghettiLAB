# TASK-120-05 — Integrare Runtime con Core e Config

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0
**Dipende da:** [TASK-120-04](TASK-120-04-implement-runtime-load-start-and-stop.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Logger campione ogni secondo con main corto.

---

## File da aprire

`CMakeLists.txt`, `subsys/core/core.c` e `subsys/config/config.c`.

---

## Cosa scrivere o modificare

Aggiungere sorgenti Runtime e Timer. Inizializzare Runtime da Core. Dopo Config applica
l'assegnazione del modulo, risolvere l'ID del modulo, caricare l'attività di
campionamento 1000 ms e avviare Runtime. Propagare ogni guasto.

---

## Perché

Main deve smettere di possedere il comportamento dell'applicazione.

---

## Chi usa il risultato

Core/Config/Runtime.

---

## Evento che attiva il codice

BOOT poi periodica timer.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA, poi `k_timer` → `k_sem` → thread.

---

## Contesto di esecuzione

Principale per impostazione; Runtime thread per lettura.

---

## Chiamate e dipendenze

Config -> Runtime; Runtime -> Manager -> Data.

---

## Input

Configurazione interna period/module.

---

## Output

Logger campione ogni secondo con main corto.

---

## Errori da gestire

Il fallimento di avvio di Runtime deve rendere l'avvio degraded/error.

---

## Non implementare ancora

- Soglia di relè o CBOR

---

## Procedura

- [ ] Apri solo `CMakeLists.txt`, `subsys/core/core.c` e `subsys/config/config.c`.
- [ ] Aggiungere sorgenti Runtime e Timer. Inizializzare Runtime da Core. Dopo Config
      applica l'assegnazione del modulo, risolvere l'ID del modulo, caricare l'attività
      di campionamento 1000 ms e avviare Runtime. Propagare ogni guasto.
- [ ] Gestire solo questi errori realistici: Runtime avvio guasto deve rendere l'avvio
      degraded/error.
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

Misurare dieci timestamp; fermare Runtime tramite test temporaneo e verificare le
letture.

---

## Risultato atteso

Campioni automatici di un secondo senza logica del ciclo principale.

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

`runtime: integrate runtime with core and config`

---

## Task successivo

[TASK-120-06](TASK-120-06-remove-the-sampling-loop-from-main-and-test-cadence.md) — Rimuovere il loop da main e verificare la cadenza

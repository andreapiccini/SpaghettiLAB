# TASK-120-06 — Rimuovere il loop da main e verificare la cadenza

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0
**Dipende da:** [TASK-120-05](TASK-120-05-integrate-runtime-with-core-and-config.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Logger campione ogni secondo con main corto.

---

## File da aprire

`src/main.c` e la console seriale.

---

## Cosa scrivere o modificare

Rimuovi da `main` la lettura tramite Manager, la pubblicazione tramite Data e l'attesa
periodica. Lascia soltanto l'avvio del Core e la gestione degli errori. Esegui il flash,
osserva sequenza e timestamp di almeno dieci campioni, quindi verifica che lo stop
impedisca la produzione di nuovi campioni.

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

- [ ] Aprire solo `src/main.c` e la console seriale.
- [ ] Rimuovi gestore lettura, pubblicazione dati e sonno periodico da `main`
- [ ] lasciare solo Core boot/error manipolazione. Flash e osservare sequence/timestamps
      per almeno dieci campioni, quindi verificare arresto impedisce ulteriori campioni.
- [ ] Gestire solo questi errori realistici: Runtime avvio guasto deve rendere l'avvio
      degraded/error.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Misurare dieci timestamp; fermare Runtime tramite test temporaneo e verificare le
letture.

---

## Risultato atteso

Runtime pubblica un campione reale ogni 1000 ms, mentre `main` non esegue lavori
periodici.

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

`runtime: remove the sampling loop from main and test cadence`

---

## Task successivo

[TASK-130-01](../130-relay-runtime-v1/TASK-130-01-define-the-relay-command-contract.md) — Definire il contratto dei comandi Relay

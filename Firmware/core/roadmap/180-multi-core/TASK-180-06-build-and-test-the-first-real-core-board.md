# TASK-180-06 — Compilare e provare la prima board Core reale

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-180-05](TASK-180-05-enumerate-devicetree-ports.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso comportamento Port 0/SHT40 sul target di board personalizzata.

---

## File da aprire

File da tavolo, generato DTS/config, e l'hardware collegato Core.

---

## Cosa scrivere o modificare

Selezionare la nuova scheda attraverso il percorso `BOARD` environment/configuration
esistente, eseguire una build pristine, ispezionare i nodi Port generati,
flash, e ripetere i percorsi SHT40/Relay senza modifiche di livello superiore.

---

## Perché

L'astrazione è già provata, in modo da refactor ha parità osservabile.

---

## Chi usa il risultato

West/CMake/Port.

---

## Evento che attiva il codice

BUILD/BOOT.

---

## Meccanismo di invocazione

I descrittori del tempo ACQUISTO poi BOOT DIRECT CALL.

---

## Contesto di esecuzione

Costruisci tools/main thread.

---

## Chiamate e dipendenze

Macro generate e Device Model.

---

## Input

Vera prima descrizione della scheda Core.

---

## Output

Stesso comportamento Port 0/SHT40 sul target di board personalizzata.

---

## Errori da gestire

Scoperta da tavolo, convalida DTS, prontezza del dispositivo.

---

## Non implementare ancora

- Copia tutte le definizioni di devkit ciecamente o aggiungi indovina la seconda scheda

---

## Procedura

- [ ] Aprire solo i file della scheda, generato DTS/config, e l'hardware collegato Core.
- [ ] Selezionare la nuova scheda attraverso il percorso `BOARD`
      environment/configuration esistente, eseguire una build pristine,
      ispezionare i nodi Port generati, flash, e ripetere i percorsi SHT40/Relay senza
      modifiche di livello superiore.
- [ ] Gestisci solo questi errori realistici: Scoperta da tavolo, validazione DTS,
      prontezza del dispositivo.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Confronta Port capability/status e misura reale con il vecchio obiettivo devkit.

---

## Risultato atteso

Il vero scarponi da tavola ed espone la sua Port count/capabilities attraverso l'API
pubblica inalterata.

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

`multiple: build and test the first real core board`

---

## Task successivo

[TASK-180-07](TASK-180-07-build-a-second-core-variant.md) — Compilare una seconda variante Core

# TASK-180-04 — Spostare i dati hardware verificati nel DTS della board

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-180-03](TASK-180-03-create-the-first-real-spaghetti-board-skeleton.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso comportamento Port 0/SHT40 sul target di board personalizzata.

---

## File da aprire

La nuova scheda DTS e i relativi file pinctrl/partition.

---

## Cosa scrivere o modificare

Descrivi la MCU verificata, la console, il controller I2C, i nodi Port fisici, i
riferimenti di capacità e il vero cablaggio power/presence. Mantieni le assegnazioni
runtime SHT40/Relay fuori dal DTS.

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

- [ ] Aprire solo la nuova scheda DTS e i relativi file pinctrl/partition.
- [ ] Descrivi il McU verificato, la console, il controller I2C, i nodi Port fisici, i
      riferimenti di capacità e il cablaggio power/presence reale.
- [ ] Tenere le assegnazioni runtime SHT40/Relay fuori dal DTS.
- [ ] Gestisci solo questi errori realistici: Scoperta da tavolo, validazione DTS,
      prontezza del dispositivo.
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

Confronta Port capability/status e misura reale con il vecchio obiettivo devkit.

---

## Risultato atteso

Nessun'etichetta C3 pin/controller in livelli superiori o dati del catalogo Port.

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

`multiple: move verified hardware facts into board dts`

---

## Task successivo

[TASK-180-05](TASK-180-05-enumerate-devicetree-ports.md) — Enumerare i Port dal Devicetree

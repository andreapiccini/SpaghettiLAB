# TASK-180-05 — Enumerare i Port dal Devicetree

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-180-04](TASK-180-04-move-verified-hardware-facts-into-board-dts.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso comportamento Port 0/SHT40 sul target di board personalizzata.

---

## File da aprire

`subsys/port/port.c`.

---

## Cosa scrivere o modificare

Sostituire il descrittore hardcoded singolo e il riferimento `DT_NODELABEL(i2c...)` con
l'enumerazione dei tempi di compilazione delle istanze `spaghettilab,port` abilitate.
Popolare i descrittori fissi dalle proprietà generate ed eliminare il momentaneo codice
Port 0.

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

- [ ] Apri solo `subsys/port/port.c`.
- [ ] Sostituire il descrittore hardcoded singolo e il riferimento
      `DT_NODELABEL(i2c...)` con l'enumerazione dei tempi di compilazione delle istanze
      `spaghettilab,port` abilitate. Popolare i descrittori fissi dalle proprietà
      generate ed eliminare il momentaneo codice Port 0.
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

`multiple: enumerate devicetree ports`

---

## Task successivo

[TASK-180-06](TASK-180-06-build-and-test-the-first-real-core-board.md) — Compilare e provare la prima board Core reale

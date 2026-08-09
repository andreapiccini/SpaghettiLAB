# TASK-180-03 — Creare la prima definizione board Spaghetti LAB

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-180-02](TASK-180-02-validate-the-port-binding.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stesso comportamento Port 0/SHT40 sul target di board personalizzata.

---

## File da aprire

Crea i file richiesti sotto `boards/spaghettilab/<real_core_name>/` seguendo il modello
di scheda Zephyr installato.

---

## Orientamento Zephyr — board definition e defconfig

1. **Cos’è:** Una board definition è l’insieme di metadati, DTS, Kconfig e runner con cui Zephyr riconosce un target hardware. Il `defconfig` contiene i default Kconfig specifici della board.
2. **A cosa serve:** Consente a `west build -b <board>` di scegliere SoC, hardware statico e metodo di flash senza rami nel codice applicativo.
3. **Quando viene usato:** West e CMake scoprono la board all’inizio della build; DTS e defconfig vengono poi uniti alla configurazione.
4. **Build-time o runtime:** Build-time.
5. **Collegamento con questo task:** Questa è la prima board Spaghetti LAB reale che sostituisce il target generico ESP32-C3.
6. **File reali coinvolti:** File sotto `boards/spaghettilab/<nome_core_reale>/`, seguendo esattamente il layout delle board Zephyr 4.4 installate.
7. **Cosa guardare nei file:** Controlla `board.yml`, DTS della board, file Kconfig/defconfig, qualifier e runner richiesti dalla versione installata.
8. **Cosa non modificare:** Non inventare varianti, revisioni o runner; non copiare una board di una versione Zephyr diversa e non spostare logica runtime nel DTS.

---

## Cosa scrivere o modificare

Aggiungi solo i metadati verificati `board.yml`, board DTS, `Kconfig.<board>`, defconfig
e necessari qualifier/runner. Usa le convenzioni Zephyr 4.4 installate e nessuna
variante speculativa.

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

- [ ] Aprire solo Crea i file richiesti sotto `boards/spaghettilab/<real_core_name>/`
      seguendo il modello di scheda Zephyr installato.
- [ ] Aggiungere solo `board.yml` verificato, scheda DTS, `Kconfig.<board>`, defconfig e
      i metadati qualifier/runner richiesti.
- [ ] Utilizzare le convenzioni di bordo Zephyr 4.4 installate e nessuna variante
      speculativa.
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

`multiple: create the first real spaghetti board skeleton`

---

## Task successivo

[TASK-180-04](TASK-180-04-move-verified-hardware-facts-into-board-dts.md) — Spostare i dati hardware verificati nel DTS della board

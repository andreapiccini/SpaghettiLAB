# TASK-020-02 — Ispezionare il Devicetree generato

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C
**Dipende da:** [TASK-020-01](TASK-020-01-verify-the-real-i2c-controller-and-pins.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Mappatura verificata, non valori indovinati.

---

## File da aprire

`build/zephyr/zephyr.dts` e le definizioni di ESP32-C3 DTS/pinctrl installate
all'interno di `make shell`.

---

## Orientamento Zephyr — Devicetree, DTS e DTSI

1. **Cos’è:** Il Devicetree è la descrizione gerarchica dell’hardware nota a Zephyr. I file `.dts` descrivono una board completa; i `.dtsi` sono frammenti inclusi e riutilizzati.
2. **A cosa serve:** Permette alla build di sapere quali periferiche esistono, indirizzi, pin, stato e collegamenti senza codificarli negli algoritmi C.
3. **Quando viene usato:** La board selezionata, i `.dtsi` del SoC e gli overlay dell’applicazione vengono uniti durante la build.
4. **Build-time o runtime:** Build-time; il risultato genera macro e oggetti device usati poi a runtime.
5. **Collegamento con questo task:** Prima di cambiare I2C devi vedere quale controller e quali label esistono davvero nella board ESP32-C3 selezionata.
6. **File reali coinvolti:** `build/zephyr/zephyr.dts` è il risultato finale; i sorgenti originali sono indicati nei commenti del file e nella directory board di Zephyr.
7. **Cosa guardare nei file:** Cerca `i2c`, `status`, le node label come `i2c0` e i riferimenti `pinctrl-*`.
8. **Cosa non modificare:** Non modificare `build/zephyr/zephyr.dts`, i `.dts` o `.dtsi` installati da Zephyr; in questo task devi soltanto ispezionarli.

---

## Cosa scrivere o modificare

Individuare l'etichetta del controller I2C verificata, il suo stato attuale e la
sintassi ESP32-C3 pinctrl installata. Registrare le etichette esatte dei nodi necessarie
per overlay; non modificare i file generati.

---

## Perché

I2C non può essere attivato in modo sicuro senza un vero cablaggio.

---

## Chi usa il risultato

La overlay della scheda funziona.

---

## Evento che attiva il codice

Hardware Bring-up.

---

## Meccanismo di invocazione

DESIGN/BUILD-TIME INPUT.

---

## Contesto di esecuzione

Revisione degli sviluppatori.

---

## Chiamate e dipendenze

Generato Zephyr Devicetree e installato file ESP32-C3 DTS.

---

## Input

Controllore reale e pin; se pull-ups/power esistono.

---

## Output

Mappatura verificata, non valori indovinati.

---

## Errori da gestire

Ambiguo revision/wiring: fermarsi e risolvere fisicamente.

---

## Non implementare ancora

- Scheda personalizzata o Spaghetti binding

---


## Procedura

- [ ] Aprire solo le definizioni `build/zephyr/zephyr.dts` e ESP32-C3 DTS/pinctrl
      installate all'interno di `make shell`.
- [ ] Individuare l'etichetta di controllo I2C verificata, il suo stato attuale e la
      sintassi ESP32-C3 pinctrl installata.
- [ ] Registrare le etichette esatte dei nodi richieste dalla overlay
- [ ] non modificare i file generati.
- [ ] Gestire solo questi errori realistici: Ambiguous revision/wiring: fermare e
      risolvere fisicamente.
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

Controllo incrociato Continuity/schematic, se del caso.

---

## Risultato atteso

I controller e le etichette pinctrl sono noti e non contengono valori di GPIO
ipotizzati.

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

`current: inspect the current generated devicetree`

---

## Task successivo

[TASK-020-03](TASK-020-03-enable-the-i2c-node-in-the-board-overlay.md) — Abilitare I2C nell’overlay della scheda

# TASK-020-03 — Abilitare I2C nell’overlay della scheda

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C
**Dipende da:** [TASK-020-02](TASK-020-02-inspect-the-current-generated-devicetree.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Abilitato il nodo I2C nel DTS finale.

---

## File da aprire

`boards/esp32c3_devkitm_esp32c3.overlay`.

---

## Orientamento Zephyr — overlay, node label e pinctrl

1. **Cos’è:** Un overlay è un file che modifica il Devicetree della board selezionata senza cambiare i sorgenti Zephyr. Una node label, per esempio `i2c0`, permette di riferirsi a un nodo già definito. `pinctrl` descrive su quali GPIO viene instradata la periferica.
2. **A cosa serve:** Adatta controller e pin della board generica al cablaggio reale di Spaghetti LAB.
3. **Quando viene usato:** Zephyr unisce l’overlay al DTS della board durante la configurazione della build.
4. **Build-time o runtime:** Build-time.
5. **Collegamento con questo task:** Il controller I2C esiste già nel SoC; qui devi abilitarlo e associargli soltanto i pin verificati nel task precedente.
6. **File reali coinvolti:** `boards/esp32c3_devkitm_esp32c3.overlay`.
7. **Cosa guardare nei file:** Confronta le label e la sintassi `pinctrl` con `build/zephyr/zephyr.dts` e con i file board installati.
8. **Cosa non modificare:** Non inserire ancora il nodo SHT40, un’identità di modulo rimovibile o numeri dei pin copiati da un’altra board.

---

## Cosa scrivere o modificare

Aggiungi o ridefinisci il vero controller I2C e il suo vero pinctrl. Solo modello concettuale:

```dts
/* I2C_CONTROLLER and I2C_PINCTRL are placeholders resolved in Step 2.1. */
&I2C_CONTROLLER {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;
    pinctrl-0 = <&I2C_PINCTRL>;
    pinctrl-names = "default";
};
```

Definire il corrispondente gruppo ESP32 pinctrl utilizzando la sintassi già utilizzata
dall'ESP32-C3 DTS/bindings installato; non copiare numeri dei pin da un'altra scheda.

---

## Perché

Port ha bisogno di un dispositivo di controllo Zephyr pronto.

---

## Chi usa il risultato

Strumenti Devicetree e driver I2C di Zephyr.

---

## Evento che attiva il codice

BUILD.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

Compilatore Devicetree e compilatore C.

---

## Chiamate e dipendenze

Binding I2C/pinctrl esistenti del SoC.

---

## Input

Controllore verificato e mappatura pin.

---

## Output

Abilitato il nodo I2C nel DTS finale.

---

## Errori da gestire

Etichetta sconosciuta, pinctrl non valido, conflitto pin.

---

## Non implementare ancora

- Nodo figlio SHT40 o identità del modulo rimovibile

---


## Procedura

- [ ] Apri solo `boards/esp32c3_devkitm_esp32c3.overlay`.
- [ ] Aggiungi o ridefinisci il vero controller I2C e il suo vero modello pinctrl. Solo modello
      concettuale: Aggiungi l'esatto blocco DTS mostrato in **Cosa scrivere o modificare**.
- [ ] Definire il corrispondente gruppo ESP32 pinctrl utilizzando la sintassi già
      utilizzata dall'ESP32-C3 DTS/bindings installato
- [ ] non copiare numeri dei pin da un'altra scheda.
- [ ] Gestisci solo questi errori realistici: etichetta sconosciuta, pinctrl non valido,
      conflitto pin.
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

Il modello di controllo non contiene alcun segnaposto irrisolto prima della build.

---

## Risultato atteso

L’overlay descrive solo il cablaggio statico dei bus.

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

`current: enable the i2c node in the board overlay`

---

## Task successivo

[TASK-020-04](TASK-020-04-enable-zephyr-i2c-support.md) — Abilitare il supporto I2C di Zephyr

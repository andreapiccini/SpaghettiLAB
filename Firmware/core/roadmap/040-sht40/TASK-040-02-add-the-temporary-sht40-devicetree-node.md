# TASK-040-02 — Aggiungere il nodo Devicetree temporaneo di SHT40

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-01](TASK-040-01-inspect-the-installed-sht4x-driver.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Esempio di dispositivo `DT_NODELABEL(sht40_test)`.

---

## File da aprire

`boards/esp32c3_devkitm_esp32c3.overlay`.

---

## Orientamento Zephyr — binding YAML e proprietà compatible

1. **Cos’è:** Un binding YAML descrive quali proprietà sono valide per una famiglia di nodi Devicetree. La proprietà `compatible` seleziona il binding e permette a Zephyr di creare l’istanza del driver corretto.
2. **A cosa serve:** Collega temporaneamente l’indirizzo I2C reale al driver SHT4x già fornito da Zephyr.
3. **Quando viene usato:** Binding e nodo vengono validati ed elaborati durante la build; il driver risultante viene inizializzato al boot.
4. **Build-time o runtime:** Definizione a build-time, device utilizzato a runtime.
5. **Collegamento con questo task:** Serve a provare verticalmente il sensore prima di rimuovere questa associazione statica nella fase 080.
6. **File reali coinvolti:** `boards/esp32c3_devkitm_esp32c3.overlay`; consulta il binding SHT4x trovato nel task precedente dentro il workspace Zephyr.
7. **Cosa guardare nei file:** Nel binding controlla valore `compatible`, proprietà richieste e significato di `reg`; nell’overlay aggiungi il nodo figlio al bus I2C.
8. **Cosa non modificare:** Non creare un binding Spaghetti LAB, non copiare proprietà non previste e non trasformare questa assegnazione temporanea in architettura definitiva.

---

## Cosa scrivere o modificare

Sotto il controller I2C reale già abilitato aggiungere:

```dts
/* TEMPORARY SHORTCUT: removed in Milestone 8. */
sht40_test: sht4x@44 {
    compatible = "sensirion,sht4x";
    reg = <0x44>;
    repeatability = <2>;
};
```

Utilizzare `0x44` solo dopo aver verificato l'effettiva selezione module/address. Il
nodo statico serve soltanto per il bring-up iniziale: non rappresenta il modello finale
del modulo rimovibile.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> Questo è intenzionalmente temporaneo e verrà rimosso in
  [TASK-080-05](../080-runtime-removable-sht40/TASK-080-05-remove-the-static-sensor-shortcut.md).


---

## Perché

Device Model ha bisogno di un'istanza DT per il sensore standard driver.

---

## Chi usa il risultato

Zephyr SHT4x driver e wrapper temporanei.

---

## Evento che attiva il codice

BUILD.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

Devicetree/CMake.

---

## Chiamate e dipendenze

Controllore I2C reale e binding installato.

---

## Input

Indirizzo e bus verificati.

---

## Output

Esempio di dispositivo `DT_NODELABEL(sht40_test)`.

---

## Errori da gestire

Conflitto di indirizzo, ripetibilità richiesta mancante, bus sbagliato.

---

## Non implementare ancora

- Una scoperta di spaghetti Port binding o runtime

---


## Procedura

- [ ] Apri solo `boards/esp32c3_devkitm_esp32c3.overlay`.
- [ ] Sotto il controller I2C già abilitato aggiungi: Aggiungi il blocco DTS esatto
      mostrato in **Cosa scrivere o modificare**.
- [ ] Utilizzare `0x44` solo dopo aver verificato l'effettiva selezione module/address.
      Il nodo statico serve soltanto per il bring-up iniziale e non rappresenta il
      modello finale del modulo rimovibile.
- [ ] Gestisci solo questi errori realistici: conflitto di indirizzi, ripetibilità
      richiesta mancante, bus sbagliato.
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

Nessun segnaposto rimane; il commento dice chiaramente temporaneo.

---

## Risultato atteso

Nodo del sensore statico valido.

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

`sht40: add the temporary sht40 devicetree node`

---

## Task successivo

[TASK-040-03](TASK-040-03-enable-the-sensor-api.md) — Abilitare l’API Sensor di Zephyr

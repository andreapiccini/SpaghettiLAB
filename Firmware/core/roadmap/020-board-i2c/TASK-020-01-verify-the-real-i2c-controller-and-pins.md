# TASK-020-01 — Verificare controller e pin I2C reali

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C
**Dipende da:** [TASK-010-07](../010-core/TASK-010-07-build-and-flash-the-core-boundary.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Mappatura verificata, non valori indovinati.

---

## File da aprire

Lo schema Core, lo schema del connettore del modulo e l'attuale pinout della scheda
ESP32-C3.

---

## Cosa scrivere o modificare

Annota il controller esatto, i pin SDA e SCL, le resistenze di pull-up, la linea di
alimentazione e la revisione della scheda che raggiungono fisicamente le Spaghetti Port.
Non modificare i
file di produzione.

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

Scheda Schematic ed ESP32-C3 DTS.

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

- [ ] Apri solo lo schema Core, lo schema del connettore del modulo e l'attuale pinout
      della scheda ESP32-C3.
- [ ] Registrare il controller esatto, SDA pin, SCL pin, disposizione di trazione, power
      rail, e revisione di bordo che raggiungono fisicamente gli Spaghetti Port
      previsti.
- [ ] Non modificare i file di produzione.
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

Controllare la mappatura rispetto alle informazioni schematiche e di continuità.

---

## Risultato atteso

Per il prossimo task viene registrata una mappatura I2C specifica per la revisione
univoca.

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

`current: verify the real i2c controller and pins`

---

## Task successivo

[TASK-020-02](TASK-020-02-inspect-the-current-generated-devicetree.md) — Ispezionare il Devicetree generato

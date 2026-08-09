# TASK-040-08 — Compilare e ispezionare l’immagine SHT40

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-07](TASK-040-07-call-the-sht40-wrapper-from-main.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Temperatura e umidità una volta al secondo.

---

## File da aprire

`build/zephyr/.config`, `build/zephyr/zephyr.dts` e `build/zephyr/zephyr.bin`.

---

## Cosa scrivere o modificare

Eseguire una build incontaminata. Confermare `CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, il
nodo `sht40_test` è abilitato all'indirizzo verificato e il binario del firmware esiste.
Non modificare i file generati.

---

## Perché

Non procedere alle astrazioni senza la prova bus/sensor reale.

---

## Chi usa il risultato

Imbracatura di prova principale.

---

## Evento che attiva il codice

BOOT/PERIODIC TEST LOOP.

---

## Meccanismo di invocazione

DIRECT CALL e `k_sleep`, non `K_TIMER` ancora.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Temporary wrapper -> Sensor API -> I2C.

---

## Input

Connected powered SHT40.

---

## Output

Temperatura e umidità una volta al secondo.

---

## Errori da gestire

Errore Init/read; log e riprova solo con una politica chiara.

---

## Non implementare ancora

- Programmazione Runtime, zbus, MQTT

---

## Procedura

- [ ] Apri solo `build/zephyr/.config`, `build/zephyr/zephyr.dts` e
      `build/zephyr/zephyr.bin`.
- [ ] Eseguire una build pulita.
- [ ] Confermare `CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, il nodo `sht40_test` è abilitato
      all'indirizzo verificato e il binario del firmware esiste.
- [ ] Non modificare i file generati.
- [ ] Gestire solo questi errori realistici: Errore Init/read; registrare e riprovare
      solo con una politica chiara.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

NO

---

## Verifica

Osservare temperature/humidity plausibile; disconnettere il sensore e verificare un
errore limitato piuttosto che crash/hang; reconnect/reset.

---

## Risultato atteso

L'istanza statica SHT4x e wrapper compilano in un'immagine lampeggiante.

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

`sht40: build and inspect the sht40 image`

---

## Task successivo

[TASK-040-09](TASK-040-09-flash-and-test-the-real-sht40.md) — Caricare e provare il sensore SHT40 reale

# TASK-040-09 — Caricare e provare il sensore SHT40 reale

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40
**Dipende da:** [TASK-040-08](TASK-040-08-build-and-inspect-the-sht40-image.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Temperatura e umidità una volta al secondo.

---

## File da aprire

L'hardware collegato SHT40, root `README.md` e la console seriale.

---

## Cosa scrivere o modificare

Esegui il flash dell'immagine corrente e osserva valori plausibili di temperatura e
umidità una volta al
secondo, quindi scollegare il sensore e verificare il percorso di lettura segnala un
errore controllato. Ripristinare l'hardware dopo il test.

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

- [ ] Aprire solo l'hardware SHT40 connesso, il root `README.md` e la console seriale.
- [ ] Esegui il flash dell'immagine corrente e osserva valori plausibili di temperatura
      e umidità una
      volta al secondo, quindi scollegare il sensore e verificare il percorso di lettura
      segnala un errore controllato. Ripristinare l'hardware dopo il test.
- [ ] Gestire solo questi errori realistici: Errore Init/read; registrare e riprovare
      solo con una politica chiara.
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

Osservare temperature/humidity plausibile; disconnettere il sensore e verificare un
errore limitato piuttosto che crash/hang; reconnect/reset.

---

## Risultato atteso

La temperatura e l'umidità reali sono visibili, e un sensore mancante non si blocca o
reimposta la scheda.

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

`sht40: flash and test the real sht40`

---

## Task successivo

[TASK-050-01](../050-module-driver/TASK-050-01-define-the-minimal-module-instance.md) — Definire l’istanza minima di Module

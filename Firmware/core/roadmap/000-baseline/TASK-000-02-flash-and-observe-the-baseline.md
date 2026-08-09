# TASK-000-02 — Caricare e osservare la baseline

**Stato:** ✅ DONE
**Fase:** 000 — Baseline
**Dipende da:** [TASK-000-01](TASK-000-01-build-the-untouched-application.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Saluto di stivale e uptime ogni cinque secondi a 115200 baud.

---

## File da aprire

Root `README.md`, sezione Flash e console seriale per il sistema operativo host.

---

## Cosa scrivere o modificare

Nessuna modifica.

---

## Perché

Il lavoro Port/I2C dovrebbe iniziare solo dopo il ripristino della console e della
scheda.

---

## Chi usa il risultato

Sviluppatore.

---

## Evento che attiva il codice

FIRMWARE DEPLOY.

---

## Meccanismo di invocazione

Utensile HOST FLASH, poi monitor seriale.

---

## Contesto di esecuzione

Host OS.

---

## Chiamate e dipendenze

Esegui `make flash`, poi `make screen` su Linux, macOS o Windows. La generazione attiva
Zephyr seleziona il corridore flash; usa `PORT=<device>` solo quando il rilevamento
automatico non è disponibile o ambiguo.

---

## Input

Immagine incorporata e una porta rilevata automaticamente o `PORT` esplicita.

---

## Output

Saluto di stivale e uptime ogni cinque secondi a 115200 baud.

---

## Errori da gestire

Porta Busy/wrong e ingresso bootloader non riuscito.

---

## Non implementare ancora

- I2C o nuova registrazione

---

## Procedura

- [x] Aprire solo Root `README.md`, sezione Flash e console seriale per il sistema
      operativo host.
- [x] Nessuna modifica.
- [x] Gestisci solo questi errori realistici: port Busy/wrong e bootloader entry
      failure.
- [x] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [x] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

NO

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Reimposta la scheda con monitor seriale aperto.

---

## Risultato atteso

La console stampa il saluto ESP32-C3 e aumenta l'uptime a 115200 baud.

---

## Checklist di completamento

- [x] La documentazione o il file di implementazione richiesto è stato modificato come
      specificato
- [x] Il tipo, la funzione, la configurazione o il test indicato esiste
- [x] La build riesce quando il task la richiede
- [x] La verifica specifica del task passa
- [x] Non è stata aggiunta funzionalità estranea al task

---

## Commit suggerito

`baseline: flash and observe the baseline`

---

## Task successivo

[TASK-010-01](../010-core/TASK-010-01-define-the-core-public-api.md) — Definire l’API pubblica di Core

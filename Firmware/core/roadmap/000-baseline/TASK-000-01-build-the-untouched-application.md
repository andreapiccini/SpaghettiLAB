# TASK-000-01 — Compilare l’applicazione senza modifiche

**Stato:** ✅ DONE
**Fase:** 000 — Baseline
**Dipende da:** Nessuno
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

`build/zephyr/zephyr.bin` con una build completata correttamente.

---

## File da aprire

`Makefile`, `compose.yaml`, `src/main.c` solo per la lettura.

---

## Orientamento Zephyr — west e build Zephyr

1. **Cos’è:** `west` è lo strumento a riga di comando che coordina workspace, build, flash e runner di Zephyr.
2. **A cosa serve:** Trasforma sorgenti, configurazione e descrizione della board negli artefatti dentro `build/`.
3. **Quando viene usato:** In questo progetto viene chiamato dal target `make build` all’interno del container Docker.
4. **Build-time o runtime:** Build-time; non esiste nel firmware in esecuzione.
5. **Collegamento con questo task:** Serve a dimostrare che ambiente e board selezionata funzionano prima di cambiare codice.
6. **File reali coinvolti:** `Makefile` contiene il comando; `compose.yaml` fornisce l’ambiente; `build/zephyr/zephyr.bin` è l’output.
7. **Cosa guardare nei file:** Nel Makefile individua `west build`, la board e la directory `build`; non serve ancora conoscere tutte le opzioni.
8. **Cosa non modificare:** Non modificare file sotto `build/`, né il workspace Zephyr contenuto nell’immagine Docker.

---

## Cosa scrivere o modificare

Niente.

---

## Perché

Ogni guasto successivo deve essere distinguibile dal guasto ambientale.

---

## Chi usa il risultato

Flusso di lavoro degli sviluppatori.

---

## Evento che attiva il codice

Controllo baseline.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

Host invocando Docker Compose.

---

## Chiamate e dipendenze

Obiettivo `make build` esistente e immagine Docker.

---

## Input

Applicazione esistente e bordo `esp32c3_devkitm/esp32c3`.

---

## Output

`build/zephyr/zephyr.bin` con una build completata correttamente.

---

## Errori da gestire

Manca Docker image/daemon o generazione stantia; utilizzare `make image` solo se
l'immagine è assente, quindi `make pristine` se necessario.

---

## Non implementare ancora

- Qualsiasi file di architettura

---

## Procedura

- [x] Aprire solo `Makefile`, `compose.yaml`, `src/main.c` solo per la lettura.
- [x] Niente.
- [x] Gestisci solo questi errori realistici: manca Docker image/daemon o generazione
      stantia; usa `make image` solo se l'immagine è assente, quindi `make pristine` se
      necessario.
- [x] Conferma nessun elemento da **Non implementare ancora** è stato aggiunto
- [x] Eseguire il test dell'attività e confrontarlo con **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

NO

---

## Verifica

Confermare le uscite di comando zero e `build/zephyr/zephyr.bin` esiste.

---

## Risultato atteso

`make build` esce con successo e `build/zephyr/zephyr.bin` esiste.

---

## Checklist di completamento

- [x] Documentazione richiesta o file di implementazione modificato come specificato
- [x] Il tipo, la funzione, la configurazione o il test nominativi esistono
- [x] La generazione ha successo quando questo compito richiede una generazione
- [x] Passate di prova specifiche per attività
- [x] Non è stata aggiunta alcuna funzionalità non correlata

---

## Commit suggerito

`baseline: build the untouched application`

---

## Task successivo

[TASK-000-02](TASK-000-02-flash-and-observe-the-baseline.md) — Caricare e osservare la baseline

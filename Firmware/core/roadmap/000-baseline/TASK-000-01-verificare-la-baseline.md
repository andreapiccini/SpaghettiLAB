# TASK-000-01 — Verificare build, flash e console

**Stato:** ✅ DONE
**Fase:** 000 — Baseline

## Cosa devo fare

### Passo 1 — Compilare l’applicazione senza modifiche

`Makefile`, `compose.yaml`, `src/main.c` solo per la lettura.

Niente.

### Passo 2 — Caricare e osservare la baseline

Root `README.md`, sezione Flash e console seriale per il sistema operativo host.

Nessuna modifica.

## Perché è fatto così

Stabilisce un riferimento noto: gli errori successivi non possono essere confusi con problemi di Docker, flash o console.

## Come si usa

Lo sviluppatore esegue build e flash dal computer host; nessuna API C viene aggiunta.

## Concetto Zephyr da sapere

### Compilare l’applicazione senza modifiche

1. **Cos’è:** `west` è lo strumento a riga di comando che coordina workspace, build, flash e runner di Zephyr.
2. **A cosa serve:** Trasforma sorgenti, configurazione e descrizione della board negli artefatti dentro `build/`.
3. **Quando viene usato:** In questo progetto viene chiamato dal target `make build` all’interno del container Docker.
4. **Build-time o runtime:** Build-time; non esiste nel firmware in esecuzione.
5. **Collegamento con questo task:** Serve a dimostrare che ambiente e board selezionata funzionano prima di cambiare codice.
6. **File reali coinvolti:** `Makefile` contiene il comando; `compose.yaml` fornisce l’ambiente; `build/zephyr/zephyr.bin` è l’output.
7. **Cosa guardare nei file:** Nel Makefile individua `west build`, la board e la directory `build`; non serve ancora conoscere tutte le opzioni.
8. **Cosa non modificare:** Non modificare file sotto `build/`, né il workspace Zephyr contenuto nell’immagine Docker.

## Checklist di completamento

- [x] Compilare l’applicazione senza modifiche.
- [x] Caricare e osservare la baseline.

## Verifica e fine task

Esegui `make build`, verifica `build/zephyr/zephyr.bin`, flasha e osserva almeno due messaggi di uptime. Fine quando non ci sono reset e l’uptime cresce.

# TASK-010-01 — Implementare il confine Core

**Stato:** 🟨 IN PROGRESS
**Fase:** 010 — Core

## Cosa devo fare

### Passo 1 — Definire l’API pubblica di Core

`include/spaghetti/core.h`.

Aggiungere una protezione include; dichiarare `enum spaghetti_core_state {
SPAGHETTI_CORE_UNINITIALIZED, SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`, `int
spaghetti_core_init(void);`, e `enum spaghetti_core_state
spaghetti_core_get_state(void);`.

### Passo 2 — Implementare stato e inizializzazione di Core

`subsys/core/core.c`.

Registra un modulo di log Zephyr. Implementa `spaghetti_core_init()` in modo da
impostare lo stato privato su `SPAGHETTI_CORE_READY`, registra `Spaghetti Core ready` e
restituisce `0`. Implementa `spaghetti_core_get_state()` come getter in sola lettura.

### Passo 3 — Aggiungere Core alla build dell’applicazione

`CMakeLists.txt` e `prj.conf`.

Aggiungere `include` a `target_include_directories(app PRIVATE ...)`, aggiungere
`subsys/core/core.c` a `target_sources(app PRIVATE ...)` e abilitare `CONFIG_LOG=y`
senza rimuovere le opzioni di console esistenti.

### Passo 4 — Chiamare Core da main

`src/main.c`.

Includi `<spaghetti/core.h>`, chiama `spaghetti_core_init()` una volta prima del loop
uptime esistente, log/print il suo ritorno negativo e stop/return in caso di guasto.
Mantenere il loop uptime per la prova.

### Passo 5 — Organizzare i log del firmware

Apri, nell'ordine:

1. `prj.conf`, per vedere le opzioni già selezionate;
2. `src/main.c`, per trovare il modulo `spaghetti_app` e gli eventuali
   `printk()`;
3. `subsys/core/core.c`, per trovare il livello fisso che genera `LOG002`;
4. il nuovo `Kconfig`, da creare nella root del progetto.

### 1. Crea il file Kconfig dell'applicazione

Crea `Kconfig` nella root con:

```kconfig
mainmenu "Spaghetti LAB firmware"

menu "Spaghetti LAB"

module = SPAGHETTI_APP
module-str = Spaghetti LAB application
source "subsys/logging/Kconfig.template.log_config"

module = SPAGHETTI_CORE
module-str = Spaghetti LAB Core
source "subsys/logging/Kconfig.template.log_config"

endmenu

source "Kconfig.zephyr"
```

La variabile `module` determina il nome del simbolo generato. Per esempio,
`SPAGHETTI_CORE` produce `CONFIG_SPAGHETTI_CORE_LOG_LEVEL`.

`source "Kconfig.zephyr"` collega il Kconfig dell'applicazione al resto della
configurazione Zephyr e deve comparire una sola volta.

### 2. Configura il modulo Core

In `subsys/core/core.c`, sostituisci:

```c
LOG_MODULE_REGISTER(spaghetti_core, LOG_LEVEL_INF);
```

con:

```c
LOG_MODULE_REGISTER(
	spaghetti_core,
	CONFIG_SPAGHETTI_CORE_LOG_LEVEL
);
```

Il primo parametro è il nome visualizzato nei log. Il secondo è il livello
massimo incluso nella build per quel modulo.

### 3. Configura il modulo applicazione

In `src/main.c` deve esserci una sola registrazione:

```c
LOG_MODULE_REGISTER(
	spaghetti_app,
	CONFIG_SPAGHETTI_APP_LOG_LEVEL
);
```

Usa:

- `LOG_ERR()` quando l'inizializzazione fallisce;
- `LOG_INF()` per avvio, stato READY e uptime;
- `LOG_DBG()` solo per dettagli utili durante lo sviluppo.

Non aggiungere timestamp, nome del modulo, colori o `\n` alle stringhe: il
backend di logging Zephyr gestisce già questi elementi.

### 4. Mantieni il risultato di inizializzazione locale

Il logger non sostituisce il valore restituito dalla funzione:

```c
int ret = spaghetti_core_init();

if (ret < 0) {
	LOG_ERR("Core initialization failed: %d", ret);
	return ret;
}
```

`ret` esiste solo per controllare e propagare una singola chiamata. Non deve
diventare una variabile globale o uno stato del componente.

### 5. Rimuovi printk soltanto dopo il controllo

Controlla:

```sh
rg -n "\bprintk\s*\(" src include subsys spaghetti_modules
```

Se non viene trovata alcuna chiamata di progetto, rimuovi
`CONFIG_PRINTK=y` da `prj.conf`. Non rimuoverla prima.

### Passo 6 — Definire le convenzioni per tipi ed errori

`FIRMWARE_IMPLEMENTATION_GUIDE.md`, `templates/firmware/change_contract.md.template`,
`templates/firmware/public_api.h.template`, `roadmap/README.md` e gli indici delle
attività per le fasi future dei componenti.

Aggiungi un passaggio obbligatorio chiamato **Inventario dei tipi** prima di implementare
l'API o gli algoritmi di ogni componente. L'inventario deve elencare ogni stato,
identificatore, modalità,
comando, valore, configurazione, snapshot, ragione diagnostica e lunghezza del buffer
che attraversa il confine del componente.

Aggiorna la roadmap in modo che ogni fase futura dei componenti definisca i suoi tipi
pubblici prima di implementare lo stato o gli algoritmi. Riusare un'attività type/API
focalizzata esistente quando già prevede quel gate; aggiungere o dividere un'attività
solo quando una fase attualmente salta direttamente dalla prosa all'implementazione non
digitata.

Non creare tutti i futuri tipi di firmware in questa attività. Questa attività definisce
le regole di decisione e assicura che le attività successive introducono ogni tipo solo
quando il suo contratto componente diventa concreto.

### Passo 7 — Compilare e provare il confine di Core

`README.md`, `src/main.c` e la console seriale.

Non aggiungere codice. Costruisci, flash, resetta la scheda e cattura l'output di avvio
che prova l'inizializzazione di Core prima del loop temporaneo di uptime.

## Perché è fatto così

`main` resta minimo e Core diventa l’unico coordinatore del boot e dello stato globale di inizializzazione.

## Come si usa

`main()` chiama `spaghetti_core_init()` una volta. I diagnostici leggono `spaghetti_core_get_state()` senza poter modificare lo stato.

## Concetto Zephyr da sapere

### Implementare stato e inizializzazione di Core

La logging Zephyr fornisce livelli di log a build-time ed evita
l'output ad hoc sulla console. Questo task richiede soltanto un messaggio di log
del modulo ed un messaggio di prontezza.

### Aggiungere Core alla build dell’applicazione

1. **Cos’è:** CMake costruisce l’elenco dei sorgenti e degli include che formeranno l’applicazione Zephyr.
2. **A cosa serve:** Dice alla build che `subsys/core/core.c` deve essere compilato e che `include/` contiene header pubblici.
3. **Quando viene usato:** Zephyr legge `CMakeLists.txt` durante la configurazione della build, prima della compilazione C.
4. **Build-time o runtime:** Build-time.
5. **Collegamento con questo task:** Senza questa modifica l’API Core può esistere negli header, ma la sua implementazione non entra nel firmware.
6. **File reali coinvolti:** `CMakeLists.txt` nella root del progetto.
7. **Cosa guardare nei file:** Cerca `target_sources(app ...)` e `target_include_directories(app ...)`; `app` è il target applicazione creato da Zephyr.
8. **Cosa non modificare:** Non modificare i file CMake installati da Zephyr e non aggiungere ancora sorgenti di componenti futuri.

### Organizzare i log del firmware

| Domanda | Risposta concreta per questo task |
|---|---|
| **Cos'è un modulo di logging?** | È il nome assegnato a un gruppo di messaggi Zephyr. Permette di vedere chi ha prodotto il messaggio e di scegliere quali severità compilare. |
| **A cosa serve?** | Distingue, per esempio, un errore di `spaghetti_app` da uno stato comunicato da `spaghetti_core`, senza aggiungere prefissi manuali alle stringhe. |
| **Quando viene usato?** | `LOG_MODULE_REGISTER()` registra il modulo durante la compilazione; `LOG_INF()` e `LOG_ERR()` producono messaggi quando il firmware è in esecuzione. |
| **Build-time o runtime?** | Il livello `CONFIG_SPAGHETTI_*_LOG_LEVEL` è deciso a build-time. La produzione dei messaggi avviene a runtime. |
| **Come si collega al task?** | Il warning `LOG002` esiste perché `spaghetti_core` usa il livello fisso `LOG_LEVEL_INF`. Questo task introduce il simbolo Kconfig configurabile. |
| **Quali file reali sono coinvolti?** | `Kconfig`, `prj.conf`, `src/main.c`, `subsys/core/core.c` e, solo per verifica, `build/zephyr/.config`. |
| **Cosa devo guardare?** | In `Kconfig` le definizioni dei due livelli; in `prj.conf` i valori selezionati; nei file C la registrazione del modulo e le chiamate `LOG_*`. |
| **Cosa non devo modificare?** | Non modificare `subsys/logging/Kconfig.template.log_config`, `Kconfig.zephyr` o `build/zephyr/.config`: appartengono a Zephyr o sono generati dalla build. |

### Differenza tra Kconfig e prj.conf

`Kconfig` **dichiara quali opzioni esistono**, il loro tipo e le scelte
possibili. In questo task farà esistere:

```text
CONFIG_SPAGHETTI_APP_LOG_LEVEL
CONFIG_SPAGHETTI_CORE_LOG_LEVEL
```

`prj.conf` **sceglie i valori dell'applicazione** per la build corrente:

```text
CONFIG_LOG=y
CONFIG_SPAGHETTI_APP_LOG_LEVEL_INF=y
CONFIG_SPAGHETTI_CORE_LOG_LEVEL_INF=y
```

Durante la build Zephyr unisce queste informazioni e genera
`build/zephyr/.config`. Quel file serve per controllare il risultato, non deve
essere modificato manualmente.

## Checklist di completamento

- [x] Definire l’API pubblica di Core.
- [ ] Implementare stato e inizializzazione di Core.
- [ ] Aggiungere Core alla build dell’applicazione.
- [ ] Chiamare Core da main.
- [ ] Organizzare i log del firmware.
- [ ] Definire le convenzioni per tipi ed errori.
- [ ] Compilare e provare il confine di Core.

## Verifica e fine task

Esegui `./validator`, `make pristine`, flash e reset. Fine quando Core registra READY una sola volta prima dei log App e un errore simulato porta allo stato ERROR.

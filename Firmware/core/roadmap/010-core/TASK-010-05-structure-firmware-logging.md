# TASK-010-05 — Organizzare i log del firmware

**Stato:** ⬜ TODO
**Fase:** 010 — Core
**Dipende da:** [TASK-010-04](TASK-010-04-call-core-from-main.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Sostituire le stampe dirette con due moduli di logging Zephyr:

- `spaghetti_app` per ciò che avviene in `main.c`;
- `spaghetti_core` per ciò che avviene nel componente Core.

Al termine, livello e presenza dei messaggi devono essere configurabili tramite
Kconfig e il validator non deve più segnalare `C010` o `LOG002`.

---

## Prima di iniziare: logging, Kconfig e prj.conf

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

---

## File da aprire

Apri, nell'ordine:

1. `prj.conf`, per vedere le opzioni già selezionate;
2. `src/main.c`, per trovare il modulo `spaghetti_app` e gli eventuali
   `printk()`;
3. `subsys/core/core.c`, per trovare il livello fisso che genera `LOG002`;
4. il nuovo `Kconfig`, da creare nella root del progetto.

---

## Modifiche da eseguire

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

---

## Input

- risultato restituito da `spaghetti_core_init()`;
- uptime restituito da `k_uptime_get()`;
- livelli selezionati in `prj.conf`.

## Output

- un messaggio INFO di `spaghetti_core` quando Core raggiunge READY;
- messaggi INFO di `spaghetti_app` per avvio e uptime;
- un messaggio ERROR di `spaghetti_app` con il valore negativo originale se
  l'inizializzazione fallisce.

## Errori da gestire

Se `spaghetti_core_init()` restituisce un valore negativo:

1. registralo una sola volta nel punto in cui puoi aggiungere contesto;
2. restituisci lo stesso valore;
3. non sostituirlo con `-1`;
4. non salvare l'errore in uno stato globale.

---

## Non implementare ancora

- backend personalizzati, file di log, syslog o trasporto MQTT;
- modifica dinamica dei livelli tramite comandi;
- macro wrapper attorno a `LOG_*`;
- rimozione del loop temporaneo dell'uptime;
- variabili globali come `last_error`.

---

## Procedura

- [ ] Apri i quattro file indicati e identifica il ruolo di ciascuno.
- [ ] Crea il `Kconfig` dell'applicazione con i due moduli.
- [ ] Collega `spaghetti_app` a `CONFIG_SPAGHETTI_APP_LOG_LEVEL`.
- [ ] Collega `spaghetti_core` a `CONFIG_SPAGHETTI_CORE_LOG_LEVEL`.
- [ ] Sostituisci tutti i `printk()` di progetto con il livello `LOG_*` corretto.
- [ ] Mantieni locale il risultato dell'inizializzazione e propagalo invariato.
- [ ] Rimuovi `CONFIG_PRINTK=y` solo se la ricerca non trova chiamate.
- [ ] Esegui una build pristine e verifica i simboli generati.
- [ ] Controlla che non sia stato aggiunto nulla da **Non implementare ancora**.

---

## Build

Esegui una build pristine perché hai aggiunto il punto di ingresso Kconfig:

```sh
make pristine
```

## Flash

NO. Il task successivo verifica i messaggi sulla scheda reale.

## Verifica

```sh
rg -n "CONFIG_SPAGHETTI_(APP|CORE)_LOG_LEVEL" \
  Kconfig prj.conf build/zephyr/.config

rg -n "\bprintk\s*\(" src include subsys spaghetti_modules

python3 validator
```

Il primo comando deve trovare entrambi i livelli. Il secondo non deve trovare
`printk()` appartenenti al progetto. Il validator non deve più segnalare
`C010` o `LOG002` per App e Core.

---

## Risultato atteso

La build riesce. Ogni messaggio mostra modulo e severità; i livelli App e Core
sono configurabili tramite Kconfig e gli errori mantengono il valore negativo
originale.

---

## Checklist di completamento

- [ ] `Kconfig` definisce i livelli App e Core tramite il template Zephyr.
- [ ] `prj.conf` seleziona entrambi i livelli INFO.
- [ ] `main.c` registra una sola volta `spaghetti_app`.
- [ ] `core.c` registra una sola volta `spaghetti_core`.
- [ ] Il codice di progetto non contiene più `printk()`.
- [ ] La build pristine riesce senza simboli Kconfig mancanti.
- [ ] Il validator non segnala più `C010` o `LOG002` per questi file.
- [ ] Non sono stati aggiunti backend, trasporti o stati globali.

---

## Commit suggerito

`logging: structure core boot diagnostics`

---

## Task successivo

[TASK-010-06](TASK-010-06-define-component-type-and-error-conventions.md) — Definire le convenzioni per tipi ed errori

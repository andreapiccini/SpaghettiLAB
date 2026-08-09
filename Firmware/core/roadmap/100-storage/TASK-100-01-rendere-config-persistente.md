# TASK-100-01 — Rendere Config persistente

**Stato:** ⬜ TODO
**Fase:** 100 — Config persistente

## Cosa devo fare

### Passo 1 — Definire l’API di storage sincrono

Crea `subsys/services/storage/storage.h`.

Dichiara `spaghetti_storage_init()`, `spaghetti_storage_read_config()` e
`spaghetti_storage_write_config()` intorno a un record fisso versione. Definisci
proprietario buffer/snapshot esplicito e codici di ritorno realistici.

### Passo 2 — Implementare e provare il backend storage RAM

Creare `subsys/services/storage/storage.c` e un sito di chiamata di test focalizzato.

Implementare un record fisso in-memory con il comportamento empty/not-found, limitato
copy-in/copy-out, la conservazione della versione e sovrascrivere la semantica. Non
aggiungere codice per la memoria flash in questo task.

### Passo 3 — Verificare e definire la partizione di storage

Il layout flash della scheda verificato e il file di partizione overlay/Devicetree
appropriato.

Ispezionare le partizioni flash correnti, selezionare una regione reale non sovrapposta
e definisci una partizione fissa `storage` usando il binding già fornito da Zephyr. Non
indovinare un indirizzo o una dimensione.

### Passo 4 — Abilitare Zephyr Settings e il relativo backend

`prj.conf`.

Abilitare `CONFIG_SETTINGS=y` e il backend non basato su filesystem verificato nella versione installata,
come `CONFIG_SETTINGS_NVS=y`, solo dopo l'esistenza della partizione di archiviazione.
Aggiungere solo le dipendenze backend richieste da Kconfig warnings/help.

### Passo 5 — Implementare il record persistente con Settings

`subsys/services/storage/storage.c` e `CMakeLists.txt`.

Registra un handler di Zephyr Settings. Nella callback, decodifica il record di
configurazione con versione fissa e caricalo nello stato privato del componente
Storage. Implementa il salvataggio tramite l'API Settings, aggiungi il sorgente a CMake
e propaga gli errori restituiti dal backend.

### Passo 6 — Caricare Config all’avvio e provare la persistenza

`subsys/core/core.c`, `subsys/config/config.c` e la console seriale.

Inizializzare Archiviazione prima di Config, caricare l'istantanea salvata, convalidarla
e applicala. Definisci in modo esplicito il comportamento al primo avvio, quando non
esiste ancora una configurazione salvata. Scrivi uno snapshot
valido cambiato, riavviare e confermare lo stesso ritorno dell'assegnazione; i dati
corrupt/version-mismatch devono ripiegare in modo sicuro.

### Contratti completi da scrivere

In `subsys/services/storage/storage.h` dichiara:

```c
#define SPAGHETTI_STORAGE_CONFIG_KEY "config"
struct spaghetti_storage_record { uint32_t magic; uint32_t version; struct spaghetti_config config; };
int spaghetti_storage_init(void);
int spaghetti_storage_read_config(struct spaghetti_config *out);
int spaghetti_storage_write_config(const struct spaghetti_config *config);
```

Il record è privato di Storage, copiabile e valido solo durante read/write; `magic` e
`version` rifiutano dati incompatibili. `out` appartiene al chiamante, è non `const`
perché viene scritto e cambia solo dopo una lettura completa valida. `config` è un
prestito `const`, copiato sincronicamente. Le funzioni restituiscono `0`; read usa
`-ENOENT` per record assente, `-EBADMSG` per record corrotto e propaga errori backend.

Implementa prima un backend RAM privato con `bool present` e una copia del record, poi
sostituiscilo con Zephyr Settings mantenendo le firme. In `prj.conf` abilita Settings e
il backend flash realmente supportato; nel DTS usa una sola partizione verificata e non
sovrapposta. Core inizializza Storage, tratta `-ENOENT` come primo avvio, altrimenti
valida/applica Config. Scrivi solo dopo apply riuscito.

## Perché è fatto così

La persistenza salva il modello Config già validato; non introduce un secondo modello di configurazione.

## Come si usa

Core inizializza Storage, legge il record `config`, lo valida e lo applica; dopo un commit Config scrive il nuovo snapshot.

## Concetto Zephyr da sapere

### Verificare e definire la partizione di storage

Le partizioni Flash sono un layout hardware di tempo di compilazione. Un offset errato
può sovrascrivere il firmware, quindi i confini di partizione e DTS generati devono
essere ispezionati prima dell'uso.

### Abilitare Zephyr Settings e il relativo backend

1. **Cos’è:** Settings è l’API key/value di Zephyr. NVS e ZMS sono backend che memorizzano quei valori su flash con organizzazioni diverse.
2. **A cosa serve:** Separa il contratto con cui Config salva un record dal formato fisico usato nella partizione.
3. **Quando viene usato:** Kconfig sceglie Settings e il backend durante la build; inizializzazione, lettura e scrittura avvengono a runtime.
4. **Build-time o runtime:** Selezione a build-time, persistenza a runtime.
5. **Collegamento con questo task:** La partizione `storage` è stata verificata nel task precedente; ora puoi collegarla a un backend reale.
6. **File reali coinvolti:** `prj.conf`; la partizione resta nel file Devicetree/partition già definito.
7. **Cosa guardare nei file:** Leggi l’help Kconfig delle opzioni `CONFIG_SETTINGS`, `CONFIG_SETTINGS_NVS` o dell’alternativa disponibile nella versione installata.
8. **Cosa non modificare:** Non abilitare contemporaneamente backend casuali, non cambiare la partizione e non salvare ancora storico misure o segreti.

## Checklist di completamento

- [ ] Definire l’API di storage sincrono.
- [ ] Implementare e provare il backend storage RAM.
- [ ] Verificare e definire la partizione di storage.
- [ ] Abilitare Zephyr Settings e il relativo backend.
- [ ] Implementare il record persistente con Settings.
- [ ] Caricare Config all’avvio e provare la persistenza.

## Verifica e fine task

Prova backend RAM con record assente, round-trip e versione errata. Poi build pristine, verifica partizione, salva, spegni/riaccendi e controlla Config applicata; corruzione deve essere deterministica.

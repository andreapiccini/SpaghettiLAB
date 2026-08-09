# TASK-060-01 — Implementare il Driver Registry

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry

## Cosa devo fare

### Passo 1 — Dichiarare l’API di Driver Registry

`include/spaghetti/driver_registry.h`.

Dichiara `int spaghetti_driver_registry_init(void);`, `const struct
spaghetti_module_driver *spaghetti_driver_registry_find(const char *type_id);` e
opzionalmente `size_t spaghetti_driver_registry_count(void);`.

### Passo 2 — Implementare la tabella statica dei driver

`subsys/driver_registry/driver_registry.c`.

Crea un array di puntatore immutabile privato contenente `&spaghetti_sht40_driver`.
Implementa la stringa esatta `spaghetti_driver_registry_find()` e il contatore opzionale
con comportamento null-safe.

### Passo 3 — Convalidare le voci del registry

`subsys/driver_registry/driver_registry.c`.

Implementa la validazione `spaghetti_driver_registry_init()` per i descrittori null,
null/empty di tipo ID, mancano i puntatori di funzionamento richiesti e duplicati di
tipo ID. Restituisci il primo errore realistico senza modificare la tabella dei conti.

### Passo 4 — Inizializzare Driver Registry da Core

`CMakeLists.txt` e `subsys/core/core.c`.

Aggiungi `subsys/driver_registry/driver_registry.c` alle sorgenti dell'applicazione.
Init registro chiamate da Core dopo l'inizializzazione Port e propaga un risultato
negativo prima che Core diventi READY.

### Passo 5 — Provare la ricerca di driver noti e sconosciuti

`src/main.c` o una posizione temporanea di test focalizzato e la console seriale.

Chiama `spaghetti_driver_registry_find("sht40")`, `find("does-not-exist")` e
`find(NULL)`. Log/assert un descrittore noto non-null e risultati invalid/unknown nulli,
quindi preserva il percorso di lettura reale corrente.

### Contratti completi da scrivere

```c
int spaghetti_driver_registry_init(void);
const struct spaghetti_module_driver *spaghetti_driver_registry_find(const char *type_id);
size_t spaghetti_driver_registry_count(void);
```

`type_id` è una stringa NUL-terminata presa in prestito e valida per la sola chiamata;
è `const` perché il Registry non la modifica. `find()` restituisce un descrittore
immutabile con lifetime firmware oppure `NULL` per stringa nulla, vuota o sconosciuta.
`count()` restituisce per valore una quantità infallibile. `init()` valida la tabella
statica `{ &spaghetti_sht40_driver }`: nessun puntatore nullo, ID vuoto/duplicato,
tabella ops nulla o operazione obbligatoria mancante; restituisce `0` o `-EINVAL`.
Core chiama init prima del Manager.

## Perché è fatto così

Una tabella fissa rende la scelta del driver deterministica, validabile al boot e priva di heap.

## Come si usa

Core inizializza il registry; Manager risolve un `type_id` con `spaghetti_driver_registry_find()` e non modifica il descrittore restituito.

## Checklist di completamento

- [ ] Dichiarare l’API di Driver Registry.
- [ ] Implementare la tabella statica dei driver.
- [ ] Convalidare le voci del registry.
- [ ] Inizializzare Driver Registry da Core.
- [ ] Provare la ricerca di driver noti e sconosciuti.

## Verifica e fine task

Prova init valido, `find("sht40")`, `find(NULL)` e tipo sconosciuto; inietta ID duplicato e ops incompleta. Fine con build, flash e lettura sensore ancora funzionante.

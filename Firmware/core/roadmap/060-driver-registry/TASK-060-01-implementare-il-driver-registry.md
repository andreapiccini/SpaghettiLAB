# TASK-060-01 — Implementare il Driver Registry

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry

## Perché lo facciamo

Una tabella fissa rende la scelta del driver deterministica, validabile al boot e priva di heap.

## Implementazione guidata

### Passo 1 — Dichiarare l’API di Driver Registry

`include/spaghetti/driver_registry.h`.

Dichiara le tre firme complete riportate più avanti, inclusa
`size_t spaghetti_driver_registry_count(void);`.

### Passo 2 — Implementare la tabella statica dei driver

`subsys/driver_registry/driver_registry.c`.

Crea un array di puntatore immutabile privato contenente `&spaghetti_ina219_driver`.
Implementa la ricerca esatta `spaghetti_driver_registry_find()` e il contatore
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

`src/main.c` e la console seriale. Inserisci qui la prova temporanea e rimuovila dopo
aver registrato il risultato.

Chiama `spaghetti_driver_registry_find("ina219")`, `find("does-not-exist")` e
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
statica `{ &spaghetti_ina219_driver }`: nessun puntatore nullo, ID vuoto/duplicato,
tabella ops nulla o operazione obbligatoria mancante; restituisce `0` o `-EINVAL`.
Core chiama init prima del Manager.

Implementazione funzione per funzione:

1. `spaghetti_driver_registry_init()` non riceve parametri perché valida la tabella
   privata. Scorre ogni voce, poi confronta ogni coppia di `type_id`; non modifica i
   descrittori. Restituisce `0` o `-EINVAL` al primo errore.
2. `spaghetti_driver_registry_find(type_id)` è chiamata dal Manager durante configure.
   Controlla `NULL` e stringa vuota, esegue confronti esatti e restituisce il puntatore
   `const` trovato o `NULL`. Non copia né conserva la stringa.
3. `spaghetti_driver_registry_count()` è usata dai diagnostici; restituisce
   `ARRAY_SIZE(drivers)` per valore, non modifica nulla e non può fallire.

Nel `.c` crea esattamente:

```c
static const struct spaghetti_module_driver *const drivers[] = {
	&spaghetti_ina219_driver,
};
```

Il primo `const` protegge il descrittore puntato; il secondo impedisce di cambiare i
puntatori nella tabella.

## Esempio d’uso

```c
const struct spaghetti_module_driver *driver =
	spaghetti_driver_registry_find("ina219");
if (driver == NULL) {
	return -ENOENT;
}
```

## Checklist di completamento

- [ ] Dichiarare l’API di Driver Registry.
- [ ] Implementare la tabella statica dei driver.
- [ ] Convalidare le voci del registry.
- [ ] Inizializzare Driver Registry da Core.
- [ ] Provare la ricerca di driver noti e sconosciuti.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Prova init valido, `find("ina219")`, `find(NULL)` e tipo sconosciuto; inietta ID duplicato e ops incompleta. Fine con build, flash e lettura sensore ancora funzionante.

**Risultato atteso**

Il descrittore `ina219` viene trovato; input nullo/sconosciuto e registry invalido sono rifiutati.

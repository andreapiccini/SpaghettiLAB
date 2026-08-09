# TASK-050-01 — Introdurre Module e Module Driver

**Stato:** ⬜ TODO
**Fase:** 050 — Module + Module Driver

## Perché lo facciamo

L’istanza appartiene al Manager, mentre il descrittore immutabile decide quali operazioni esegue il driver concreto.

## Implementazione guidata

### Passo 1 — Definire l’istanza minima di Module

`include/spaghetti/module.h`.

Definire i valori di stato `spaghetti_module_id_t`, `UNINITIALIZED`, `READY` e `ERROR`,
e `struct spaghetti_module` con solo ID, Port puntatore, driver puntatore e context
puntatore al contesto privato. Dichiara in anticipo i tipi Port e driver per evitare
dipendenze circolari tra gli header.

### Passo 2 — Definire il contratto temporaneo del campione

`include/spaghetti/module.h`.

Definire solo i campi di temperatura e umidità necessari dall'attuale SHT40 letto come
`struct spaghetti_sample`. Non aggiungere canali generalizzati, mappe dei metadati o
payload di proprietà.

### Passo 3 — Definire la tabella operazioni di Module Driver

`include/spaghetti/module_driver.h`.

Definire puntatori `spaghetti_module_driver_ops` con campi sincroni `init`, `read` e
`deinit`. Definire i campi `spaghetti_module_driver` immutabili `type_id`,
`required_capabilities` e `ops`. Modulo e tipi di campioni in avanti, invece di creare
include ciclici.

### Passo 4 — Dichiarare il descrittore del driver SHT40

`spaghetti_modules/sht40/sht40.h`.

Dichiarare l'immutabile descrittore esportato `extern const struct
spaghetti_module_driver spaghetti_sht40_driver;`. Mantenere l'API temporanea porta-up
fino a quando il percorso operation-table è dimostrato.

### Passo 5 — Adattare SHT40 alle operazioni del driver

`spaghetti_modules/sht40/sht40.c`.

Implementa le chiamate SHT40 `init`, `read` e `deinit` intorno al dispositivo statico
Zephyr SHT4x già funzionante. Definisci la tabella delle operazioni private ed esporta
il descrittore con il tipo di ID `sht40` e la capacità I2C. Mantenere le chiamate
sincrone e propagare gli errori API del sensore.

### Passo 6 — Usare SHT40 tramite la tabella operazioni

`src/main.c`, `CMakeLists.txt` e la console seriale.

Costruisci uno `spaghetti_module` temporaneo in `main`, puntalo a Port 0 e
`spaghetti_sht40_driver`, e rimpiazza le chiamate wrapper dirette con
`driver->ops->init/read/deinit`. Preserva il loop di visualizzazione di un secondo.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> L'istanza principale del modulo è intenzionalmente temporanea e verrà rimossa in
  [TASK-070-05](../070-module-manager/TASK-070-01-implementare-il-module-manager.md).

### Contratti completi da scrivere

In `include/spaghetti/module.h` definisci `typedef uint8_t spaghetti_module_id_t`,
`enum spaghetti_module_state` con UNINITIALIZED, READY ed ERROR, e:

```c
struct spaghetti_sample { int32_t temperature_millicelsius; uint32_t humidity_millipercent; };
struct spaghetti_module {
	spaghetti_module_id_t id;
	enum spaghetti_module_state state;
	const struct spaghetti_port *port;
	const struct spaghetti_module_driver *driver;
	void *context;
};
```

Manager possiede ogni istanza e il buffer privato indicato da `context`; Port e driver
sono prestiti `const` con lifetime firmware. Il campione è pubblico e copiabile; le
unità sono millesimi di °C e millesimi di percentuale relativa.

Significato dei campi di `spaghetti_module`:

- `id`: identifica un’istanza runtime, non un tipo di sensore;
- `state`: impedisce read prima di init o dopo un errore;
- `port`: puntatore perché il Port è posseduto dal catalogo Port; `const` impedisce al
  driver di modificarne il descrittore;
- `driver`: puntatore al descrittore condiviso e immutabile, valido per tutto il firmware;
- `context`: puntatore modificabile allo storage privato della singola istanza; Manager
  possiede storage e lifetime, il driver ne interpreta il contenuto.

In `include/spaghetti/module_driver.h` definisci:

```c
struct spaghetti_module_driver_ops {
	int (*init)(struct spaghetti_module *module, const void *config, size_t config_size);
	int (*read)(struct spaghetti_module *module, struct spaghetti_sample *out);
	int (*deinit)(struct spaghetti_module *module);
};
struct spaghetti_module_driver {
	const char *type_id;
	uint32_t required_capabilities;
	const struct spaghetti_module_driver_ops *ops;
};
extern const struct spaghetti_module_driver spaghetti_sht40_driver;
```

`module` è modificabile perché init/deinit aggiornano stato e context; `config` è un
buffer preso in prestito e letto solo durante init, mentre `config_size` impedisce cast
di dati della dimensione errata. `out` è del chiamante e cambia solo al successo.
Descrittore, stringa e tabella operazioni SHT40 sono immutabili e statici. Il chiamante
è il futuro Manager; SHT40 implementa init/read/deinit e propaga errno negativi.

Le tre callback hanno questo comportamento:

1. `init(module, config, config_size)` valida puntatori e dimensione, inizializza il
   context e porta `module->state` a READY solo al successo. `module` non è `const`
   perché cambia stato; `config` è `const` e preso in prestito; la size è per valore.
2. `read(module, out)` richiede READY, legge il sensore e scrive `out` solo al successo.
   Il chiamante possiede `out`; il driver non ne conserva il puntatore.
3. `deinit(module)` rende il context inutilizzabile e riporta lo stato a
   UNINITIALIZED. Restituisce `0` o un errno negativo e non libera heap.

## Esempio d’uso

```c
struct spaghetti_sample sample;
int err = module.driver->ops->read(&module, &sample);
```

## Checklist di completamento

- [ ] Definire l’istanza minima di Module.
- [ ] Definire il contratto temporaneo del campione.
- [ ] Definire la tabella operazioni di Module Driver.
- [ ] Dichiarare il descrittore del driver SHT40.
- [ ] Adattare SHT40 alle operazioni del driver.
- [ ] Usare SHT40 tramite la tabella operazioni.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Esegui validator/build e leggi SHT40 esclusivamente tramite `driver->ops`. Prova puntatori nulli e operazione mancante. Fine quando non restano chiamate al wrapper dal chiamante.

**Risultato atteso**

La lettura SHT40 passa soltanto dalla tabella operazioni e mantiene ownership e stato coerenti.

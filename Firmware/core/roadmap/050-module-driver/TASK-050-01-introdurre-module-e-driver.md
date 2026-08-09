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

Definisci `struct spaghetti_sample` con bus voltage, current e power nelle microunità
indicate più avanti. In questa prima versione il tipo è concreto e senza puntatori: non
aggiungere mappe di metadati o un sistema generico di canali.

### Passo 3 — Definire la tabella operazioni di Module Driver

`include/spaghetti/module_driver.h`.

Definire puntatori `spaghetti_module_driver_ops` con campi sincroni `init`, `read` e
`deinit`. Definire i campi `spaghetti_module_driver` immutabili `type_id`,
`required_capabilities` e `ops`. Modulo e tipi di campioni in avanti, invece di creare
include ciclici.

### Passo 4 — Dichiarare il descrittore del driver INA219

`spaghetti_modules/ina219/ina219.h`.

Dichiarare l'immutabile descrittore esportato `extern const struct
spaghetti_module_driver spaghetti_ina219_driver;`. Mantenere l'API temporanea porta-up
fino a quando il percorso operation-table è dimostrato.

### Passo 5 — Adattare INA219 alle operazioni del driver

`spaghetti_modules/ina219/ina219.c`.

Implementa le chiamate INA219 `init`, `read` e `deinit` intorno al dispositivo statico
Zephyr INA219 già funzionante. Definisci la tabella delle operazioni private ed esporta
il descrittore con il tipo di ID `ina219` e la capacità I2C. Mantenere le chiamate
sincrone e propagare gli errori API del sensore. In questa fase temporanea `init()`
accetta soltanto `config == NULL` e `config_size == 0U`; address e calibrazione arrivano
ancora dal nodo Devicetree della fase 040. La fase 080 sostituirà questo contratto con
la configurazione runtime.

### Passo 6 — Usare INA219 tramite la tabella operazioni

`src/main.c`, `CMakeLists.txt` e la console seriale.

Costruisci uno `spaghetti_module` temporaneo in `main`, puntalo a Port 0 e
`spaghetti_ina219_driver`, e rimpiazza le chiamate wrapper dirette con
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
struct spaghetti_sample {
	int32_t bus_voltage_microvolts;
	int32_t current_microamps;
	uint32_t power_microwatts;
};
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
unità sono µV, µA e µW. `bus_voltage_microvolts` è firmato per uniformare i controlli
di conversione anche se INA219 produce una tensione bus non negativa;
`current_microamps` è firmato perché INA219 misura corrente bidirezionale;
`power_microwatts` è non firmato perché il relativo registro INA219 non ha segno.

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
extern const struct spaghetti_module_driver spaghetti_ina219_driver;
```

`module` è modificabile perché init/deinit aggiornano stato e context; `config` è un
buffer preso in prestito e letto solo durante init, mentre `config_size` impedisce cast
di dati della dimensione errata. `out` è del chiamante e cambia solo al successo.
Descrittore, stringa e tabella operazioni INA219 sono immutabili e statici. Il chiamante
è il futuro Manager; INA219 implementa init/read/deinit e propaga errno negativi.

Le tre callback hanno questo comportamento:

1. `init(module, config, config_size)` valida `module`, Port, driver e context; in questa
   fase richiede `config == NULL` e size zero, controlla il device INA219 statico e porta
   `module->state` a READY solo al successo. `module` non è `const` perché cambia stato.
2. `read(module, out)` richiede READY, esegue un solo fetch, legge voltage/current/power
   in `sensor_value` locali, usa `sensor_value_to_micro()`, controlla i range dei tre
   campi e scrive `out` solo al successo. Il chiamante possiede `out`; il driver non ne
   conserva il puntatore.
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
- [ ] Dichiarare il descrittore del driver INA219.
- [ ] Adattare INA219 alle operazioni del driver.
- [ ] Usare INA219 tramite la tabella operazioni.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Esegui validator/build e leggi INA219 esclusivamente tramite `driver->ops`. Prova puntatori nulli e operazione mancante. Fine quando non restano chiamate al wrapper dal chiamante.

**Risultato atteso**

La lettura INA219 passa soltanto dalla tabella operazioni e mantiene ownership e stato coerenti.

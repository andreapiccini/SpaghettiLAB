# TASK-080-01 — Rendere INA219 configurabile a runtime

**Stato:** ⬜ TODO
**Fase:** 080 — INA219 rimovibile a runtime

## Cosa devo fare

### 1. Definire la configurazione runtime

Apri `spaghetti_modules/ina219/ina219.h` e sostituisci il wrapper temporaneo con:

```c
struct spaghetti_ina219_config {
	uint8_t i2c_address;
	uint16_t shunt_milliohm;
	uint16_t current_lsb_microamp;
};

extern const struct spaghetti_module_driver spaghetti_ina219_driver;
```

La struct è pubblica e copiabile:

- `i2c_address` è l’indirizzo I2C 7-bit; accetta `0x40`–`0x4F`, intervallo prodotto
  dalle combinazioni dei pin A0/A1 dell’INA219;
- `shunt_milliohm` è il valore fisico dello shunt in mΩ; per `R100` vale `100`;
- `current_lsb_microamp` è il peso di un bit del registro corrente in µA; questa
  roadmap usa `200` per la baseline.

Tutti sono passati per valore dentro la struct perché piccoli e privi di ownership
esterna. Il Manager passa la struct come buffer `const`; `init()` la copia nel context,
quindi il chiamante può distruggerla al ritorno.

### 2. Estendere la configure del Manager

Apri `include/spaghetti/module_manager.h` e
`subsys/module_manager/module_manager.c`. Usa questa firma esatta:

```c
int spaghetti_module_manager_configure(spaghetti_port_id_t port_id,
				       const char *type_id,
				       const void *driver_config,
				       size_t driver_config_size,
				       spaghetti_module_id_t *out_id);
```

`port_id` e size sono valori copiati. `type_id` e `driver_config` sono prestiti `const`
validi soltanto durante la chiamata. `out_id` appartiene al chiamante e viene scritto
solo dopo init riuscita. Il Manager valida puntatori e size, poi inoltra config e size
a `driver->ops->init()`. Restituisce `-EINVAL`, gli errori di lookup/capability o
l’errno del driver; su errore libera completamente lo slot provvisorio.

### 3. Implementare il protocollo INA219 su I2C

Apri `spaghetti_modules/ina219/ina219.c`. Prima di usare I2C: `struct device` rappresenta
qui il controller `i2c0`, non il sensore. Zephyr lo crea dal Devicetree della board e
Port ne prende in prestito il puntatore; il sensore rimovibile è identificato soltanto
dall’indirizzo contenuto nella config runtime.

Definisci private queste costanti e struct:

```c
#define INA219_REG_CONFIG       0x00U
#define INA219_REG_BUS_VOLTAGE  0x02U
#define INA219_REG_POWER        0x03U
#define INA219_REG_CURRENT      0x04U
#define INA219_REG_CALIBRATION  0x05U
#define INA219_CONFIG_RESET     0x8000U
#define INA219_CONFIG_TRIGGERED 0x399BU
#define INA219_BUS_CNVR         BIT(1)
#define INA219_BUS_OVF          BIT(0)

struct spaghetti_ina219_context {
	const struct device *i2c;
	struct spaghetti_ina219_config config;
	uint16_t calibration;
	bool initialized;
};
```

`i2c` è un prestito al device posseduto da Zephyr e vive per tutto il firmware;
`const` vieta al driver di modificare l’oggetto. `config` è una copia posseduta
dall’istanza. `calibration` evita di ricalcolare il registro. `initialized` impedisce
read prima di init. La struct è privata del `.c`; il Manager possiede i byte del
context per la durata dello slot.

Aggiungi questi helper privati con firme esatte:

```c
static int ina219_write_register(const struct spaghetti_ina219_context *context,
				 uint8_t reg, uint16_t value);
static int ina219_read_register(const struct spaghetti_ina219_context *context,
				uint8_t reg, uint16_t *out);
static int ina219_init(struct spaghetti_module *module,
		       const void *config, size_t config_size);
static int ina219_read(struct spaghetti_module *module,
		       struct spaghetti_sample *out);
static int ina219_deinit(struct spaghetti_module *module);
```

Negli helper, `context` è `const` perché la transazione non cambia la configurazione;
`reg` e `value` sono piccoli valori copiati; `out` è un output del chiamante. Per write
crea tre byte `{ registro, MSB, LSB }` con `sys_put_be16()` e chiama
`i2c_write(context->i2c, buffer, sizeof(buffer), context->config.i2c_address)`. Per
read chiama `i2c_write_read()` inviando il byte registro e leggendo due byte, poi usa
`sys_get_be16()`. Scrivi `*out` soltanto dopo una transazione riuscita.

Implementa `ina219_init()` così:

1. valida `module`, `module->port`, `module->context`, `config` e size esatta;
2. valida address `0x40`–`0x4F`, shunt e current LSB non nulli;
3. chiama `spaghetti_port_i2c_device(module->port)`; `NULL` produce `-ENOTSUP`;
4. calcola con `uint64_t` `calibration = 40960000 / (shunt_milliohm * current_lsb_microamp)`;
5. rifiuta risultato zero o maggiore di `UINT16_MAX` con `-ERANGE`;
6. scrive reset `0x8000`, configurazione `0x399B` e calibration register;
7. copia il context, imposta initialized e READY soltanto dopo tutti i successi.

`0x399B` sceglie bus range 32 V, gain shunt ±320 mV, ADC bus e shunt a 12 bit e modo
triggered. La formula deriva da `calibration = 0.04096 / (Rshunt_ohm * current_lsb_A)`.
Per 100 mΩ e 200 µA produce `2048` (`0x0800`).

Implementa `ina219_read()` così:

1. valida modulo READY, context initialized e `out`;
2. riscrive `0x399B` per avviare una nuova conversione triggered;
3. attende 2 ms, poi legge il bus register fino a 10 volte con 1 ms tra i tentativi;
4. se `INA219_BUS_CNVR` non appare, restituisce `-ETIMEDOUT`;
5. se `INA219_BUS_OVF` è impostato, restituisce `-ERANGE` senza pubblicare dati;
6. legge current e power register;
7. calcola in temporanei a 64 bit:
   `bus_uv = (bus_raw >> 3) * 4000`,
   `current_ua = (int16_t)current_raw * current_lsb_microamp`,
   `power_uw = power_raw * current_lsb_microamp * 20`;
8. verifica che i valori entrino nei campi del sample, poi copia `out` e restituisce 0.

Non esiste CRC nel protocollo INA219. Gli errori previsti sono `-EINVAL`, `-ENOTSUP`,
`-ENODEV`/errno I2C, `-ERANGE` e `-ETIMEDOUT`.

`ina219_deinit()` tenta di scrivere `0x0000` nel config register per power-down se il
device è ancora raggiungibile, azzera sempre il context e riporta il modulo a
UNINITIALIZED. Restituisce l’eventuale errno I2C ma non lascia puntatori utilizzabili.

### 4. Rimuovere la scorciatoia statica

Apri esattamente:

- `boards/esp32c3_devkitm_esp32c3.overlay`;
- `prj.conf`;
- `spaghetti_modules/ina219/ina219.h`;
- `spaghetti_modules/ina219/ina219.c`.

Elimina il nodo `ina219_test`, `DT_NODELABEL(ina219_test)`,
`spaghetti_ina219_test_init/read()` e ogni `sensor_*`. Rimuovi `CONFIG_SENSOR=y` se
nessun altro componente lo usa; conserva `CONFIG_I2C=y`. Il DTS finale deve descrivere
`i2c0` e il cablaggio Port, non INA219.

### 5. Configurare l’istanza runtime

Il chiamante costruisce:

```c
const struct spaghetti_ina219_config config = {
	.i2c_address = 0x40U,
	.shunt_milliohm = 100U,
	.current_lsb_microamp = 200U,
};
spaghetti_module_id_t module_id;
int err = spaghetti_module_manager_configure(
	0U, "ina219", &config, sizeof(config), &module_id);
```

Il flusso definitivo è:

```text
Port 0 -> spaghetti_port_i2c_device(port) -> i2c0 device
       -> address 0x40 dalla config -> API I2C -> INA219 -> spaghetti_sample
```

## Perché è fatto così

Controller e pin sono saldati e restano nel Devicetree. Tipo, address e calibrazione
appartengono invece al modulo rimovibile e vengono copiati dalla Config. In questo modo
il driver Spaghetti può creare, rimuovere e ricreare INA219 senza un device sensore
generato alla build.

## Come si usa

Config chiama Manager; Manager assegna Port e context; il descrittore `ina219` esegue
init/read/deinit. Runtime e Data vedono soltanto `spaghetti_sample`, mai registri I2C o
un device INA219 statico.

## Checklist

- [ ] La config contiene address, shunt e current LSB copiati.
- [ ] Il controller arriva soltanto da `spaghetti_port_i2c_device()`.
- [ ] Registri a 16 bit sono trasferiti big-endian.
- [ ] Read gestisce conversion-ready, overflow, timeout e range numerici.
- [ ] Nodo INA219 e Sensor API temporanei sono rimossi.

## Verifica e fine task

```sh
make validate
make pristine
rg -n -i "ina219_test|DT_NODELABEL.*ina219|sensor_sample|sensor_channel|CONFIG_SENSOR" \
	boards prj.conf spaghetti_modules build/zephyr/zephyr.dts build/zephyr/.config
make flash
make monitor
```

La ricerca non deve trovare scorciatoie statiche attive. Prova config size errata,
address fuori `0x40`–`0x4F`, sensore assente, timeout e overflow; gli output devono
restare invariati. Con il modulo reale, dieci letture di bus voltage/current/power
devono essere plausibili e una remove/reconfigure deve riuscire senza reboot.

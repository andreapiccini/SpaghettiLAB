# TASK-300-01 — Generalizzare Port, endpoint e trasporti

**Stato:** ⬜ TODO
**Fase:** 300 — Port e trasporti V1

## Cosa devo fare

Zephyr rappresenta ogni controller abilitato nel Devicetree con un `struct device`
creato dal Device Model a boot. I2C/SPI/UART/ADC/1-Wire sono API runtime che ricevono
quel device; GPIO/ADC possono anche usare spec generate dal DTS. Il DTS e il binding
sono build-time e descrivono soltanto wiring reale. In questo task Port conserva i
riferimenti firmware-lifetime e offre operazioni runtime bounded ai driver. Non
modificare file sotto `build/`: `build/app/zephyr/zephyr.dts` serve solo a verificare
il risultato generato.

### 1. Rendere l'endpoint abbastanza grande per bus differenti

Apri `include/spaghetti/module.h`. Sostituisci l'endpoint con:

```c
#define SPAGHETTI_ENDPOINT_VALUE_MAX 8U

enum spaghetti_module_endpoint_kind {
	SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE,
	SPAGHETTI_ENDPOINT_I2C_ADDRESS,
	SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT,
	SPAGHETTI_ENDPOINT_UART_EXCLUSIVE,
	SPAGHETTI_ENDPOINT_GPIO_LINE,
	SPAGHETTI_ENDPOINT_ADC_CHANNEL,
	SPAGHETTI_ENDPOINT_W1_ROM,
};

struct spaghetti_module_endpoint {
	enum spaghetti_module_endpoint_kind kind;
	uint8_t value_size;
	uint8_t value[SPAGHETTI_ENDPOINT_VALUE_MAX];
};
```

`kind` stabilisce il namespace; `value_size` impedisce di interpretare byte non
validi; `value` è owned dalla struct. I2C usa un byte, SPI/GPIO/ADC usano un indice
bounded, 1-Wire usa gli otto byte della ROM. `PORT_EXCLUSIVE` e `UART_EXCLUSIVE`
usano `value_size = 0`. Non convertire una ROM 1-Wire in `uint32_t`: perderesti
identità.

Aggiorna `subsys/module_manager/module_manager.c` con un helper privato
`static bool endpoints_conflict(...)`. Due endpoint confliggono se sono sulla stessa
Port e hanno kind/size/byte uguali; `PORT_EXCLUSIVE` confligge con ogni endpoint di
quella Port. Output e UART esclusivi mantengono una sola istanza.

### 2. Estendere il contratto Port

Apri `include/spaghetti/port.h` e definisci queste capability:

```c
enum spaghetti_port_capability {
	SPAGHETTI_PORT_CAP_I2C = BIT(0),
	SPAGHETTI_PORT_CAP_SPI = BIT(1),
	SPAGHETTI_PORT_CAP_UART = BIT(2),
	SPAGHETTI_PORT_CAP_DIGITAL_INPUT = BIT(3),
	SPAGHETTI_PORT_CAP_DIGITAL_OUTPUT = BIT(4),
	SPAGHETTI_PORT_CAP_ADC = BIT(5),
	SPAGHETTI_PORT_CAP_W1 = BIT(6),
};
```

Aggiungi gli include Zephyr dei tipi usati e le API complete:

```c
struct spaghetti_port_i2c_request {
	uint16_t address;
	struct i2c_msg *messages;
	uint8_t message_count;
};

struct spaghetti_port_spi_request {
	uint8_t chip_select;
	uint32_t frequency_hz;
	spi_operation_t operation;
	const struct spi_buf_set *tx;
	const struct spi_buf_set *rx;
};

int spaghetti_port_i2c_transfer(
	const struct spaghetti_port *port,
	const struct spaghetti_port_i2c_request *request,
	k_timeout_t timeout);
int spaghetti_port_spi_transceive(
	const struct spaghetti_port *port,
	const struct spaghetti_port_spi_request *request,
	k_timeout_t timeout);
const struct device *spaghetti_port_uart_device(
	const struct spaghetti_port *port);
int spaghetti_port_set_output(const struct spaghetti_port *port, bool high);
int spaghetti_port_get_input(const struct spaghetti_port *port, bool *out_high);
int spaghetti_port_adc_read(
	const struct spaghetti_port *port,
	uint8_t channel,
	int32_t *out_raw,
	int32_t *out_microvolts,
	k_timeout_t timeout);
int spaghetti_port_w1_write_read(
	const struct spaghetti_port *port,
	const uint8_t rom[SPAGHETTI_ENDPOINT_VALUE_MAX],
	const uint8_t *write_data,
	size_t write_size,
	uint8_t *read_data,
	size_t read_size,
	k_timeout_t timeout);
```

Ogni `port` è borrowed con lifetime firmware. Request e buffer sono borrowed soltanto
durante la chiamata; RX/raw/output cambiano solo al successo. Gli indici SPI/ADC sono
passati per valore perché sono piccoli e non possiedono memoria. UART restituisce un
device Zephyr borrowed: è ammesso solo per endpoint esclusivi perché callback e
framing restano responsabilità del driver UART.

Le funzioni restituiscono `0`, `-EINVAL`, `-ENOTSUP`, `-ENODEV`, `-EBUSY`,
`-ETIMEDOUT`, `-EIO` e gli errori originali Zephyr. Documenta thread context e il
fatto che I2C/SPI/ADC/1-Wire possono attendere il lock bounded del controller.

### 3. Collegare Devicetree senza inventare hardware

Devicetree descrive wiring build-time; `struct device` è l'oggetto runtime creato dal
Device Model. I phandle collegano la Port ai controller reali. Apri
`dts/bindings/spaghetti/spaghettilab,port.yaml`: rendi `i2c` opzionale e aggiungi
proprietà opzionali `spi`, `spi-cs-gpios`, `uart`, `input-gpios`, `output-gpios`,
`io-channels` e `w1`. Specifica tipo e significato. Almeno una capability viene
garantita con `BUILD_ASSERT()` in C, perché il binding YAML corrente non esprime in
modo portabile “almeno una tra queste proprietà”.

Non aggiungere queste proprietà a `spaghettilab_core_v1.dts`: lo schema corrente
verifica soltanto I2C. La predisposizione esiste nel binding e nel C, ma una capability
compare solo quando una futura board contiene il phandle/GPIO reale.

Apri `subsys/port/port.c`. Il descrittore privato conserva solo risorse generate dal
DTS. Crea una tabella bounded di lock per coppia `(transport kind, struct device *)`.
Durante `spaghetti_port_init_all()` due Port che puntano allo stesso controller
ricevono lo stesso lock. `i2c_transfer()`, `spi_transceive()`, `adc_read()` e
`w1_write_read()` eseguono lock, API Zephyr, unlock e conservano l'errno originale.
Questo corregge il caso V2 build-only in cui due Port condividono `i2c0`.

`timeout` limita l'attesa del lock condiviso; `K_FOREVER` è rifiutato. Il driver
Zephyr sottostante mantiene i propri timeout hardware documentati. Zephyr 4.4
fornisce realmente:

- `i2c_transfer()` in `<zephyr/drivers/i2c.h>`;
- `spi_transceive()` e `struct spi_config` in `<zephyr/drivers/spi.h>`;
- UART callback/async API in `<zephyr/drivers/uart.h>`;
- `adc_read_dt()` e conversione in microvolt in `<zephyr/drivers/adc.h>`;
- `w1_write_read()`/`w1_search_rom()` in `<zephyr/drivers/w1.h>`;
- GPIO tramite `<zephyr/drivers/gpio.h>`.

### 4. Migrare INA219 al confine serializzato

Apri `spaghetti_modules/ina219/ina219.c`. Il context conserva Port, non il device:

```c
struct spaghetti_ina219_context {
	const struct spaghetti_port *port;
	struct spaghetti_ina219_config config;
	uint16_t calibration;
	bool initialized;
};
```

I helper costruiscono due `struct i2c_msg` e chiamano
`spaghetti_port_i2c_transfer()`. Non chiamano più direttamente `i2c_write()` o
`i2c_write_read()`. In questo modo due INA219 o due Port sullo stesso controller non
eseguono transazioni concorrenti non coordinate.

### 5. Testare senza nuovo hardware

Estendi `tests/module_manager/`, `tests/ina219_runtime/` e crea `tests/port_transport/`.
Il fake espone due Port con lo stesso controller e verifica che il massimo numero di
transazioni contemporanee sia uno. Verifica endpoint I2C diversi, ROM 1-Wire diverse,
esclusivo contro indirizzato, capability assente, indice fuori range, errore backend e
output invariato.

## Perché è fatto così

Capability e risorse descrivono il Core; endpoint e proprietà descrivono il Module.
Separarli consente nuovi bus senza branch sul nome della board. Il lock appartiene al
controller condiviso, non a un singolo Module: è l'unico livello che vede quando due
Port referenziano lo stesso device Zephyr.

## Come si usa

Un driver I2C prepara messaggi, indirizzo runtime e chiama Port. Un futuro driver
1-Wire usa la ROM ricevuta da Config o Discovery. Un futuro Core aggiunge proprietà
DTS reali; il codice centrale non cambia.

## Checklist di completamento

- [ ] Endpoint supporta valori da zero a otto byte e collisioni corrette.
- [ ] Capability e API dei sei trasporti sono documentate e bounded.
- [ ] Controller condivisi usano lo stesso lock.
- [ ] INA219 usa Port per ogni transazione.
- [ ] Core V1 non dichiara capability non presenti.
- [ ] Test fake coprono condivisione, limiti ed errori.

## Verifica e fine task

```sh
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/port_transport -T tests/ina219_runtime \
  -T tests/module_manager -p native_sim/native/64 --inline-logs --clobber-output'
make pristine
BOARD=spaghettilab_core_v2_build_only/esp32c3 make build
```

Il risultato atteso è zero finding/test falliti, INA219 ancora compilato sulla board
reale e nessuna risorsa SPI/UART/ADC/1-Wire inventata nel DTS V1.

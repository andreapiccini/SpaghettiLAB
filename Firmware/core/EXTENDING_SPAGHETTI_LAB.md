# Guida pratica per estendere Spaghetti LAB

[← README](README.md) · [Architettura](ARCHITECTURE.md) ·
[Regole firmware](FIRMWARE_IMPLEMENTATION_GUIDE.md) · [Mappa dei file](FILE_MAP.md)

Questa guida è il punto di partenza per chi deve aggiungere un nuovo Module o una
nuova variante Core. Non serve conoscere già Zephyr, ma serve il datasheet del
componente o lo schema elettrico della nuova scheda: indirizzi, registri, pin e
polarità non possono essere dedotti dal firmware.

> [!NOTE]
> La guida descrive sia i punti di estensione già presenti sia il contratto generico
> che verrà congelato dalle fasi 300–390. Prima di implementare un nuovo tipo, controlla
> lo stato nel [piano di chiusura V1](roadmap/V1-PLATFORM-CLOSURE.md): durante la
> migrazione alcune firme mostrate qui verranno sostituite da property set, record e
> comandi tipizzati.

## Stato reale dell'estensibilità

Questa tabella evita di confondere il contratto finale con il codice già disponibile:

| Area | Oggi | Dopo il task indicato |
|---|---|---|
| Port 1:N Module | Implementata per identità ed endpoint | 300 serializza anche ogni controller condiviso dentro Port |
| Driver Registry | Tabella centrale in `driver_registry.c` | 320 usa iterable sections e non richiede patch centrali |
| Config ricevuta | Il decoder CBOR accetta soltanto INA219 | 310–330 introducono proprietà e codec generici |
| Data e comandi | Sample elettrico e comando Relay concreti | 310–340 introducono record/comandi descritti da schema |
| Discovery | Tabella runtime presente, scan hardware non generico | 350 introduce provider indipendenti |
| Communication | Shell/TLS V0 | 360 congela il Protocol V1 comune |
| BLE e profili RAM | Non implementati | 291–295 e 365–375 |

Fino al task 300, i driver I2C ottengono direttamente `const struct device *` dalla
Port: più endpoint sono ammessi, ma il lock del controller condiviso non è ancora nel
confine Port. Non avviare accessi concorrenti allo stesso bus presumendo una
serializzazione che il codice attuale non offre. Il Runtime corrente è sequenziale;
un nuovo thread/ISR del driver renderebbe visibile questo limite.

## Scegli prima cosa stai aggiungendo

| Obiettivo | Estensione corretta | Codice eseguito dove |
|---|---|---|
| Supportare un sensore o attuatore collegato a una Port | **Module driver** | Sul Core |
| Supportare una nuova scheda Core o un altro MCU | **Core/board variant** | Sulla nuova scheda |
| Collegare due periferiche I2C alla stessa Port | Due **Module runtime** distinti | Sul Core, sullo stesso bus |
| Cambiare una regola, un periodo o un endpoint MQTT | **Config/Runtime**, non un driver | Sul Core |

Una Port è una connessione fisica e può esporre un bus condiviso. Non è uno slot
occupabile: `ina219` a `0x40`, `ina219` a `0x41` e un altro dispositivo a `0x44`
possono condividere Port 0. L'identità persistente è la `key` della Config; la
collisione fisica è determinata da Port più endpoint normalizzato.

Prima di iniziare, verifica che il progetto di partenza sia sano:

```sh
make signing-key       # solo se .keys/mcuboot-dev-ecdsa-p256.pem non esiste
make pristine
make validate
```

`make pristine` usa Zephyr 4.4 nel container e compila anche MCUboot. Non modificare
mai `build/`: contiene risultati generati, non sorgenti.

## Percorso A: aggiungere un nuovo Module

Il template specifico per l'API corrente è
[`templates/firmware/module_driver.c.template`](templates/firmware/module_driver.c.template),
affiancato dal relativo
[`module_driver.h.template`](templates/firmware/module_driver.h.template). I template
generici `component.c.template` e `public_api.h.template` servono invece per un nuovo
sottosistema, non per un Module Driver.

### 1. Scrivi il contratto hardware in cinque righe

Prima del codice, crea `spaghetti_modules/<nome>/README.md` e annota:

1. trasporto richiesto, per esempio I2C;
2. endpoint che rende unica un'istanza, per esempio l'indirizzo I2C a 7 bit;
3. campi di configurazione runtime e relativi limiti;
4. dati prodotti oppure comandi accettati;
5. stato sicuro e operazioni necessarie durante `deinit()`.

Usa un `type_id` minuscolo, stabile e lungo meno di 24 byte incluso `\0`, per
esempio `"example_meter"`. Non inserire il componente nel Devicetree: il Module è
rimovibile e viene descritto dalla Config runtime. Il Devicetree contiene soltanto
il controller e la Port fisicamente presenti sul Core.

Apri prima questi contratti:

- [`include/spaghetti/module_driver.h`](include/spaghetti/module_driver.h): callback;
- [`include/spaghetti/module.h`](include/spaghetti/module.h): istanza, endpoint e sample;
- [`include/spaghetti/port.h`](include/spaghetti/port.h): accesso hardware indipendente dalla board;
- [`spaghetti_modules/ina219/ina219.c`](spaghetti_modules/ina219/ina219.c): esempio I2C leggibile;
- [`spaghetti_modules/relay/relay.c`](spaghetti_modules/relay/relay.c): esempio attuatore.

### 2. Crea header, implementazione e contesto privato

Crea:

```text
spaghetti_modules/example_meter/
├── example_meter.h
├── example_meter.c
└── README.md
```

In `example_meter.h` esponi soltanto la configurazione copiata per ogni istanza e
il descrittore immutabile:

```c
#ifndef SPAGHETTI_EXAMPLE_METER_H
#define SPAGHETTI_EXAMPLE_METER_H

#include <stdint.h>

struct spaghetti_module_driver;

struct spaghetti_example_meter_config {
	uint8_t i2c_address;
	uint16_t conversion_time_ms;
};

extern const struct spaghetti_module_driver spaghetti_example_meter_driver;

#endif /* SPAGHETTI_EXAMPLE_METER_H */
```

- `i2c_address` è passato per valore perché è un numero piccolo posseduto dalla
  configurazione. Deve contenere l'indirizzo a 7 bit, non quello spostato usato da
  alcuni datasheet.
- `conversion_time_ms` è per valore, ha unità esplicita e viene copiato nel
  contesto. Sostituiscilo con i parametri realmente necessari al componente.
- Il descrittore è `extern const`: esiste una sola volta per tutto il firmware,
  non contiene stato delle istanze e il Registry ne conserva il puntatore.

In `example_meter.c`, dopo include, costanti e `LOG_MODULE_REGISTER`, crea il
contesto privato:

```c
struct spaghetti_example_meter_context {
	const struct device *i2c;
	struct spaghetti_example_meter_config config;
	bool initialized;
};

K_MEM_SLAB_DEFINE(example_meter_context_slab,
		  sizeof(struct spaghetti_example_meter_context),
		  CONFIG_SPAGHETTI_EXAMPLE_METER_MAX_INSTANCES,
		  __alignof__(struct spaghetti_example_meter_context));
```

`struct device` è l'oggetto con cui il Device Model di Zephyr rappresenta un
controller già creato all'avvio. Il puntatore è necessario perché l'oggetto è
posseduto da Zephyr; è `const` perché il driver non deve modificarlo. Il suo
lifetime coincide con quello del firmware.

Il contesto, invece, appartiene al driver e dura da `init()` a `deinit()`. Una
`K_MEM_SLAB` è un insieme statico di blocchi tutti della stessa dimensione:
l'allocazione è deterministica, non usa heap e permette a ogni tipo di Module di
avere un contesto della misura corretta.

### 3. Implementa tutte le operazioni, in questo ordine

Le callback sono `static`: solo il descrittore pubblico le rende raggiungibili.

```c
static int example_meter_validate_config(const void *config,
					 size_t config_size);
static int example_meter_describe_endpoint(
	const void *config,
	size_t config_size,
	struct spaghetti_module_endpoint *out);
static int example_meter_init(struct spaghetti_module *module,
			      const void *config,
			      size_t config_size);
static int example_meter_read(struct spaghetti_module *module,
			      struct spaghetti_sample *out);
static int example_meter_deinit(struct spaghetti_module *module);
```

`validate_config()` è chiamata da Config e Module Manager prima di toccare
l'hardware. `config` è `const void *` perché il Manager conosce solo byte generici,
li presta per la durata della chiamata e il driver non può modificarli. Verifica
puntatore, dimensione esatta e tutti i range; copia prima con `memcpy()` in una
struct locale per evitare accessi non allineati. Restituisce `0`, `-EINVAL` per
forma/range non validi o `-ERANGE` quando un calcolo non è rappresentabile. Non
alloca e non accede al bus.

`describe_endpoint()` viene chiamata dopo la validazione. Per un dispositivo I2C
scrive solo in caso di successo:

```c
const struct spaghetti_module_endpoint endpoint = {
	.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
	.value = example_config.i2c_address,
};

*out = endpoint;
return 0;
```

Il Manager usa questo valore per rifiutare due Module allo stesso indirizzo sulla
stessa Port, ma consente indirizzi differenti. Un dispositivo che monopolizza la
Port usa `SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE`; uno SPI usa
`SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT`.

`init()` è chiamata dal Module Manager su un'istanza provvisoria. Deve:

1. verificare `module`, `module->port` e che `module->context == NULL`;
2. validare e copiare la configurazione;
3. allocare un blocco con `k_mem_slab_alloc(..., K_NO_WAIT)`;
4. ottenere il controller con `spaghetti_port_i2c_device(module->port)`;
5. verificare `device_is_ready(i2c)`;
6. eseguire solo trasferimenti I2C iniziali limitati nel tempo;
7. assegnare `module->context = context` soltanto dopo il successo completo;
8. su errore, azzerare e liberare il blocco e restituire l'errore originale.

`module` è un puntatore non `const` perché il driver pubblica il proprio context.
La Config resta borrowed: se serve dopo `init()`, deve essere copiata nel contesto.
Gli errori comuni sono `-EINVAL`, `-ENOMEM`, `-ENOTSUP`, `-ENODEV`, `-EIO`,
`-ETIMEDOUT` e `-ERANGE`.

Per I2C usa le API sincrone Zephyr da thread context:

```c
int err = i2c_write(i2c, buffer, sizeof(buffer), address);
int err = i2c_write_read(i2c, address,
			 const void *write_buf, size_t write_len,
			 void *read_buf, size_t read_len);
```

L'indirizzo viene dalla Config runtime. Non usare `DEVICE_DT_GET()` per creare
un'istanza statica del sensore: il solo `struct device *` ammesso qui è quello del
controller ottenuto dalla Port.

`read()` è chiamata dal Runtime tramite Module Manager. Deve verificare Module
READY, context e `out`, eseguire un'acquisizione limitata, convertire i dati in
unità intere esplicite e scrivere `*out` solo alla fine. Oggi
`struct spaghetti_sample` contiene esclusivamente tensione bus in microvolt,
corrente in microampere e potenza in microwatt. Un misuratore elettrico può quindi
integrarsi senza cambiare il modello dati.

`deinit()` è chiamata dal Manager durante rimozione, sostituzione o rollback. Porta
l'hardware nello stato sicuro, azzera/libera il contesto, imposta
`module->context = NULL` e non tocca altri Module sulla stessa Port. Anche se la
transizione hardware fallisce, le risorse software devono essere rilasciate.

Infine pubblica la tabella:

```c
static const struct spaghetti_module_driver_ops example_meter_ops = {
	.validate_config = example_meter_validate_config,
	.describe_endpoint = example_meter_describe_endpoint,
	.init = example_meter_init,
	.read = example_meter_read,
	.command = NULL,
	.deinit = example_meter_deinit,
};

const struct spaghetti_module_driver spaghetti_example_meter_driver = {
	.type_id = "example_meter",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &example_meter_ops,
};
```

Un driver deve avere almeno una tra `read` e `command`. Per un attuatore imposta
`read = NULL`, implementa `command()` e definisce uno stato sicuro concreto.

### 4. Registralo e riserva memoria in modo esplicito

Modifica questi tre file:

1. `CMakeLists.txt`: aggiungi `.c` a `target_sources(app PRIVATE ...)` e la
   directory a `target_include_directories(app PRIVATE ...)`;
2. `Kconfig`: aggiungi il log module e la capacità della slab;
3. `subsys/driver_registry/driver_registry.c`: includi l'header e aggiungi il
   descrittore alla tabella `drivers[]`.

Template Kconfig:

```kconfig
module = SPAGHETTI_EXAMPLE_METER
module-str = spaghetti_example_meter
source "subsys/logging/Kconfig.template.log_config"

config SPAGHETTI_EXAMPLE_METER_MAX_INSTANCES
	int "Maximum number of simultaneous Example Meter instances"
	range 1 SPAGHETTI_MAX_MODULES
	default 4
	help
	  Number of typed contexts reserved in the driver-owned memory slab.
```

Registro concreto:

```c
#include <example_meter.h>

static const struct spaghetti_module_driver *const drivers[] = {
	&spaghetti_ina219_driver,
	&spaghetti_relay_driver,
	&spaghetti_example_meter_driver,
};
```

Questa registrazione è build-time: rende disponibile il tipo, ma non crea alcuna
istanza. Le istanze nascono soltanto quando Config o Discovery invia una richiesta
al Module Manager.

### 5. Collega Config, dati e comandi solo dove serve

Il lifecycle è generico, ma tre contratti applicativi non lo sono ancora. Usa
questa tabella per non fermarti a un driver compilato ma inutilizzabile:

| Il nuovo Module… | File da modificare |
|---|---|
| Usa solo Config costruite internamente in C | Nessun cambiamento al formato CBOR |
| Deve essere creato da `spaghetti apply <config-cbor-hex>` | `subsys/config/config_cbor.c`, `subsys/config/spaghetti_config_v1.cddl`, `tests/config_codec/` |
| Produce tensione/corrente/potenza | Il `spaghetti_sample` e il canale elettrico esistenti sono sufficienti |
| Produce temperatura, umidità, movimento o altro | `include/spaghetti/module.h`, `include/spaghetti/data.h`, `subsys/data/`, `subsys/runtime/`, eventuale MQTT e relativi test |
| Accetta il comando relay ON/OFF | Il comando esistente è sufficiente solo se la semantica è davvero identica |
| Accetta un comando differente | `include/spaghetti/module_driver.h`, Module Manager, Runtime/Communication interessati e test |
| Deve essere rilevato automaticamente | Aggiungi un provider Discovery; non mettere la scansione nel driver |

Attualmente il decoder CBOR confronta esplicitamente il tipo con `"ina219"`.
Quindi un nuovo driver registrato funziona tramite API C, ma una Config ricevuta da
Shell/rete restituisce `-ENOTSUP` finché non aggiungi il relativo ramo di decode e
lo schema CDDL. Per estendere il wire format:

1. assegna chiavi numeriche ai campi senza riutilizzare chiavi esistenti;
2. decodifica prima in una struct locale tipizzata;
3. valida limiti e dimensioni;
4. copia la struct in `module->driver_config` e imposta
   `module->driver_config_size`;
5. aggiungi casi validi, troncati, fuori range e tipo sconosciuto ai test codec;
6. se rompi la compatibilità, introduci una nuova wire version invece di cambiare
   silenziosamente quella esistente.

Non aumentare `SPAGHETTI_DRIVER_CONFIG_MAX` senza misurare RAM e storage. La config
di ogni driver deve rientrare nei 64 byte correnti.

### 6. Aggiungi test e prova l'hardware

Crea `tests/example_meter_runtime/` copiando la struttura di
`tests/ina219_runtime/`: `CMakeLists.txt`, `Kconfig`, `prj.conf`, `testcase.yaml` e
`src/main.c`. Il fake bus deve verificare almeno:

- config valida e non valida;
- due indirizzi diversi sulla stessa Port accettati;
- stesso indirizzo sulla stessa Port rifiutato con `-EADDRINUSE`;
- pool esaurito con `-ENOMEM`;
- errore e timeout del bus;
- `out` non modificato quando `read()` fallisce;
- `deinit()` sicura e blocco riutilizzabile.

Esegui:

```sh
docker compose run --rm dev west twister \
  -T tests/example_meter_runtime -p native_sim/native/64 \
  --inline-logs --clobber-output
make validate
make pristine
```

Poi configura una sola istanza reale, collega massa/alimentazione/bus secondo lo
schema e controlla con `make monitor` sia il valore plausibile sia gli errori con
il dispositivo scollegato. Aggiungi una seconda istanza a un endpoint diverso per
provare davvero il modello Port 1:N.

Esempio d'uso dell'API risultante:

```c
const struct spaghetti_example_meter_config driver_config = {
	.i2c_address = 0x42U,
	.conversion_time_ms = 2U,
};
const struct spaghetti_module_request request = {
	.key = 100U,
	.port_id = 0U,
	.type_id = "example_meter",
	.driver_config = &driver_config,
	.driver_config_size = sizeof(driver_config),
	.revision = 1U,
};
spaghetti_module_id_t id;
struct spaghetti_sample sample;

int err = spaghetti_module_manager_configure(&request, &id);
if (err == 0) {
	err = spaghetti_module_manager_read(id, &sample);
}
```

`request` e `driver_config` sono owned dal chiamante e borrowed durante
`configure()`. Il driver copia ciò che conserva. `id` è effimero e non va salvato;
la `key` è l'identità persistente usata da Config e Runtime.

### Fine del percorso Module

- Il Registry trova il `type_id` esatto.
- Config invalida non accede all'hardware.
- Più endpoint distinti condividono la stessa Port.
- Non esiste heap e la capacità è visibile in Kconfig.
- Rimozione e rollback liberano il context e impongono lo stato sicuro.
- Il tipo è configurabile dal canale richiesto, non solo da un test C.
- Dati/comandi arrivano fino a Runtime e Communication senza cast privati.
- Validator, ztest, build e prova hardware passano.
- Il README del Module documenta wiring, unità, limiti ed errori.

## Percorso B: aggiungere una nuova variante Core

Una variante Core è una board Zephyr: descrive fatti statici dello schema elettrico.
Non deve conoscere `ina219`, relay o altri Module rimovibili.

Usa i template `board.yml.template`, `board.dts.template` e
`board_defconfig.template` in `templates/firmware/`. Normalmente un nuovo Core non
richiede un file `.c`: SoC, memoria, controller, pin, Port e runner appartengono ai file
Zephyr della board. Crea un backend C specifico soltanto se esiste una risorsa hardware
che il contratto comune non può ottenere da Devicetree; in quel caso esponila prima
come capability Port o servizio astratto, senza branch sul nome board.

### 1. Raccogli i dati che il firmware non può inventare

Prima di copiare file, annota:

- SoC esatto e relativa board/SoC già supportata da Zephyr 4.4;
- quantità e layout reale della flash, incluso spazio MCUboot A/B e storage;
- controller e pin per ogni Port;
- console di sviluppo e runner di flash/debug;
- Wi-Fi, TRNG e GPIO realmente disponibili;
- controller/pin condivisi dal Maintenance Link;
- livelli, pull-up, open-drain, alimentazione e stato sicuro verificati a schema.

Se uno di questi dati manca, crea soltanto una variante `build_only` chiaramente
marcata e non flasharla su hardware.

### 2. Crea la directory board

Copia la variante più vicina sotto:

```text
boards/spaghettilab/spaghettilab_core_<nome>/
├── board.yml
├── Kconfig.spaghettilab_core_<nome>
├── spaghettilab_core_<nome>.dts
├── spaghettilab_core_<nome>_defconfig
└── board.cmake                    # se la famiglia richiede un runner
```

In `board.yml` il nome diventa il valore passato a `BOARD`:

```yaml
board:
  name: spaghettilab_core_<nome>
  full_name: Spaghetti LAB Core <Nome>
  vendor: spaghettilab
  socs:
    - name: <nome_soc_zephyr>
```

Il nome SoC non è commerciale: deve coincidere con quello riconosciuto da Zephyr.
Controllalo dentro `$ZEPHYR_BASE/boards` e `$ZEPHYR_BASE/soc` dal container.

`Kconfig.spaghettilab_core_<nome>` seleziona il modello SoC reale:

```kconfig
config BOARD_SPAGHETTILAB_CORE_<NOME_MAIUSCOLO>
	select SOC_<MODELLO_ZEPHYR>
```

Il `_defconfig` abilita solo funzioni indispensabili alla board, per esempio
console, seriale e GPIO. Funzioni di prodotto come MQTT o Runtime restano in
`prj.conf`.

### 3. Descrivi hardware e Port nel DTS

Devicetree è una descrizione build-time dell'hardware. Un node label come `i2c0`
identifica un nodo del controller; `&i2c0` è un phandle, cioè un riferimento a quel
nodo. Zephyr valida il `.dts` con i binding YAML e genera macro C consumate da
`subsys/port/port.c`.

Il minimo contratto Spaghetti per una Port I2C è:

```dts
/ {
	spaghetti_ports {
		compatible = "simple-bus";
		#address-cells = <1>;
		#size-cells = <0>;

		port0: port@0 {
			compatible = "spaghettilab,port";
			reg = <0>;
			i2c = <&i2c0>;
			status = "okay";
		};
	};
};
```

- `reg = <0>` è l'ID stabile usato dalla Config runtime;
- `i2c = <&i2c0>` collega la Port al controller realmente cablato;
- `status = "okay"` rende l'istanza visibile alle macro Devicetree;
- il binding reale è
  [`dts/bindings/spaghetti/spaghettilab,port.yaml`](dts/bindings/spaghetti/spaghettilab,port.yaml).

Abilita controller e pinctrl usando i simboli della famiglia SoC, mai numeri copiati
da un'altra scheda:

```dts
&i2c0 {
	status = "okay";
	clock-frequency = <I2C_BITRATE_STANDARD>;
	pinctrl-0 = <&spaghetti_i2c0_default>;
	pinctrl-names = "default";
};
```

Pinctrl è la configurazione build-time che assegna una funzione periferica ai pin.
Il gruppo concreto deve provenire dallo schema e dalle macro pinmux del SoC. Le linee
I2C richiedono open-drain e pull-up dimensionati nell'hardware; il pull-up interno
non sostituisce automaticamente quello previsto dal progetto elettrico.

Ogni Port ha un ID diverso. Più Port possono riferire lo stesso controller solo se
lo schema rappresenta davvero lo stesso bus esposto su più connettori; non farlo per
comodità software.

### 4. Integra boot, Maintenance Link e runner

Nel nodo `chosen` verifica almeno SRAM, console, flash, code partition e, se usata,
UART di management. La build corrente è sysbuild con MCUboot: una board produzione
deve preservare un layout A/B compatibile, non soltanto compilare `src/main.c`.

Se la board offre aggiornamento/manutenzione sui pin condivisi, aggiungi un nodo
`spaghettilab,maintenance-link` conforme a
[`dts/bindings/spaghetti/spaghettilab,maintenance-link.yaml`](dts/bindings/spaghetti/spaghettilab,maintenance-link.yaml).
`normal-bus` e `maintenance-uart` sono controller, non pin hard-coded nel codice
comune. I relativi stati pinctrl appartengono esclusivamente al DTS della board.

`board.cmake` seleziona runner Zephyr già esistenti. Per ESP32 è:

```cmake
include(${ZEPHYR_BASE}/boards/common/esp32.board.cmake)
```

Non aggiungerlo a caso: usa il runner della famiglia scelta e verifica che
`make flash` produca offset coerenti con MCUboot e la flash reale.

### 5. Compila la variante e ispeziona ciò che Zephyr ha generato

Esegui senza cambiare il valore predefinito nel repository:

```sh
BOARD=spaghettilab_core_<nome>/<nome_soc_zephyr> make pristine
```

Con sysbuild, i file applicazione corretti da verificare sono:

```sh
rg -n "spaghettilab,port|maintenance-link|i2c|pinctrl" \
  build/app/zephyr/zephyr.dts
rg -n "CONFIG_BOARD|CONFIG_SOC|CONFIG_I2C|CONFIG_SERIAL" \
  build/app/zephyr/.config
```

`zephyr.dts` mostra il merge finale di include, board e overlay. `.config` mostra le
scelte Kconfig realmente attive. Entrambi sono prove diagnostiche e non vanno
modificati o committati.

Poi prova sull'hardware:

1. `make flash` e `make monitor`;
2. verifica il log di boot e il numero di Port;
3. verifica la console locale e la riconnessione dopo reset;
4. configura due Module a endpoint differenti sulla stessa Port;
5. prova Wi-Fi, storage, reboot e console remota;
6. esegui boot normale, maintenance, trial image, conferma e rollback;
7. verifica elettricamente pin, livelli e stato sicuro prima di collegare Module.

### Quando serve cambiare il codice comune

Una board che usa soltanto capability già esistenti non richiede branch nel C. Se
introduce SPI, un GPIO d'ingresso, interrupt o una risorsa di alimentazione nuova,
non aggirare il modello restituendo direttamente pin/device dal driver. Estendi in
ordine:

1. binding `dts/bindings/spaghetti/`;
2. capability e accessor pubblici in `include/spaghetti/port.h`;
3. descrittore privato e macro Devicetree in `subsys/port/port.c`;
4. fake Port e test dei componenti interessati;
5. documentazione Port e board.

Il driver continuerà a chiedere una capability alla Port e rimarrà indipendente da
MCU, board, node label e pin fisici.

### Fine del percorso Core

- Il nome board è scoperto da Zephyr 4.4 e compila con sysbuild/MCUboot.
- `build/app/zephyr/zephyr.dts` contiene controller, pin e Port previsti.
- Nessun Module rimovibile compare nel DTS.
- Port ID e capability corrispondono allo schema reale.
- Console, flash, storage, Wi-Fi e Maintenance Link sono provati sul dispositivo.
- Normal boot, trial, conferma e rollback sono qualificati.
- Il codice comune non contiene `#ifdef` o branch sul nome della board.
- [`PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md`](PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md)
  è stato riesaminato voce per voce.

## Percorso C: costruire e applicare una Config

Config è stato desiderato persistente, non una lista di operazioni. Il chiamante invia
una fotografia completa; Config calcola aggiunte, sostituzioni e rimozioni e aumenta la
generation soltanto dopo il commit.

### Config C corrente

Per un test o un default interno apri `include/spaghetti/config.h` e costruisci una
struct posseduta dal chiamante:

```c
const struct spaghetti_ina219_config ina_config = {
	.i2c_address = 0x40U,
	.shunt_milliohm = 100U,
	.current_lsb_microamp = 200U,
};
struct spaghetti_config config = {
	.version = SPAGHETTI_CONFIG_VERSION,
	.module_count = 1U,
	.sampling = {
		.enabled = true,
		.source_key = 10U,
		.period_ms = 1000U,
	},
};

config.modules[0].key = 10U;
config.modules[0].port_id = 0U;
strcpy(config.modules[0].type_id, "ina219");
config.modules[0].driver_config_size = sizeof(ina_config);
memcpy(config.modules[0].driver_config, &ina_config, sizeof(ina_config));
```

- `key` è persistente, non il runtime ID restituito dal Manager;
- `port_id` deve esistere nella board generata;
- `driver_config` possiede una copia, mai un puntatore alla variabile locale;
- `sampling.source_key` deve riferire una key presente nella stessa fotografia;
- MQTT disabilitato richiede host, porta e topic vuoti.

Leggi la generation corrente e applica con optimistic concurrency:

```c
struct spaghetti_config current;
struct spaghetti_config_error error;
uint32_t generation;
int err;

err = spaghetti_config_get_snapshot(&current, &generation);
if (err == 0) {
	err = spaghetti_config_validate(&config, &error);
}
if (err == 0) {
	err = spaghetti_config_apply(&config, generation);
}
```

`current` serve qui per ottenere una snapshot coerente e la generation; non viene
modificata. Un altro apply completato nel frattempo rende la generation stale e il
chiamante deve rileggere, non sovrascrivere alla cieca. Apply può fare I/O e rollback;
non chiamarlo da ISR, timer o callback di rete.

### Config CBOR corrente

Il formato autorevole è
[`subsys/config/spaghetti_config_v1.cddl`](subsys/config/spaghetti_config_v1.cddl).
Oggi il comando è:

```text
spaghetti apply <config-cbor-hex>
```

La mappa root wire version 2 usa:

```text
0 → versione wire, valore 2
1 → array completo dei Module
2 → configurazione sampling
3 → configurazione MQTT
```

Per ogni INA219: `0=key`, `1=Port`, `2="ina219"`, `3={0=address,
1=shunt_milliohm, 2=current_lsb_microamp}`. Non usare dump della struct C: padding,
endianness e puntatori non fanno parte del wire format.

Non esiste ancora un compilatore JSON supportato nel repository. Il task 380 lo
aggiungerà usando il catalogo. Fino ad allora considera i payload in
`tests/config_codec/src/main.c` esempi di test, non una comoda interfaccia utente.
Quando aggiungi oggi un tipo al wire devi modificare CDDL, decoder e test nello stesso
commit; dal task 330 questa patch centrale non sarà più necessaria.

### Config Zephyr non è Config runtime

I nomi simili indicano livelli diversi:

| File | Decide | Quando |
|---|---|---|
| board `.dts` / overlay | MCU, pin, controller, Port, flash | build-time |
| board `_defconfig` | minimo necessario per avviare quella scheda | build-time |
| root `Kconfig` | feature e capacità selezionabili | configure-time |
| `prj.conf` | feature dell'immagine applicativa | build-time |
| `struct spaghetti_config` / CBOR | Module, schedule, regole e servizi desiderati | runtime |

Un indirizzo I2C di un Module rimovibile appartiene alla Config runtime. I pin SDA/SCL
e il controller appartengono al DTS. Il numero massimo di istanze appartiene a Kconfig.

## Caveat specifici di Spaghetti LAB

### Ownership e lifetime

- `const struct device *` è posseduto dal Device Model Zephyr e dura per tutto il
  firmware; non liberarlo e non modificarlo.
- `struct spaghetti_module` è posseduta dal Module Manager. Il driver può modificare
  soltanto il proprio `context` nei punti previsti.
- Config, command e buffer passati alle callback sono borrowed per la sola chiamata;
  copia ciò che deve sopravvivere.
- Descriptor driver e operation table sono `static const` o `extern const` con lifetime
  firmware; non inserirvi stato di una singola istanza.
- Non trasferire un puntatore a stack attraverso zbus, msgq, work o callback asincrone.

### Concorrenza e contesti Zephyr

- Timer e ISR notificano soltanto; I2C, flash, socket, logging complesso e Config apply
  vengono eseguiti da thread.
- Un mutex protegge un invariant, non “un file”. Documenta chi lo acquisisce e non
  mantenerlo durante callback esterne se non è parte esplicita del contratto.
- Dopo il task 300 il lock del bus appartiene alla Port. Non aggiungere un mutex per
  driver: due driver differenti sullo stesso controller non lo condividerebbero.
- `K_THREAD_DEFINE` e `K_THREAD_STACK_DEFINE` riservano RAM anche quando il thread non
  lavora. Prima di creare un worker, verifica se basta Runtime o una workqueue esistente.
- Ogni wait ha timeout o una motivazione di lifetime; un timeout non autorizza a
  lasciare callback o socket vivi dopo `deinit()`/`stop()`.

### Errori e transazioni

- Scrivi gli output solo al successo: calcola in una variabile locale e copia alla fine.
- Conserva il primo errore che spiega la causa; un errore di cleanup va loggato ma non
  deve nasconderlo.
- Init pubblica context/READY soltanto dopo l'ultimo passo fallibile. Cleanup procede
  in ordine inverso.
- Config apply è transazionale. Non aggiornare Storage o generation prima che Module,
  Runtime e servizi siano riconciliabili; in errore ripristina la fotografia precedente.
- `-ENODEV` significa hardware non disponibile, non build fallita. `undefined reference`
  è invece un oggetto/simbolo assente al link.

### Identità, versione e compatibilità

- Port ID identifica una connessione fisica; Module key identifica il desiderio
  persistente; Module ID identifica uno slot vivo e può cambiare dopo reboot.
- `type_id`, field ID, command ID, operation ID e schema version sono contratti. Non
  riutilizzare un ID rimosso con un significato differente.
- L'endpoint normalizzato decide la collisione: stessa Port non significa conflitto;
  stessa Port più stesso indirizzo/chip-select sì.
- `timestamp_ms` corrente è uptime. Dopo la fase 310 usa anche boot ID; non trattarlo
  come Unix time.
- Un nuovo wire incompatibile richiede versione/migrazione. Non reinterpretare record
  NVS scritti con layout C precedente.

### Zephyr e build

- `DEVICE_DT_GET()` non cerca hardware a runtime: produce un riferimento da Devicetree
  compilato. Per un Module rimovibile usa il controller esposto dalla Port.
- Controlla sempre `build/app/zephyr/zephyr.dts` e `.config`; non dedurre il risultato
  finale guardando un solo overlay o `prj.conf`.
- `make pristine` è necessario dopo cambi strutturali a DTS, Kconfig, CMake o sysbuild.
- `make validate` vede le sorgenti del target CMake. Un file non aggiunto a
  `target_sources` può essere perfetto ma non entra nel firmware.
- Un header trovato non prova che il relativo `.c` sia linkato. Distingui errore include,
  compile, link e hardware.
- Il profilo futuro descrive budget software; Devicetree resta l'autorità sull'hardware.
  Non dichiarare BLE, PSRAM o una Port perché il SoC teoricamente potrebbe averli.

### Sicurezza, update e segreti

- Wi-Fi, MQTT, OTA, BLE e console hanno credenziali e permessi diversi. Non copiarli
  dentro Config dei Module.
- Password, PSK e chiavi non entrano in argv, log, README, fixture o repository.
- `NORMAL`, `MAINTENANCE`, `TRIAL/CONFIRMED` e `LOW_ENERGY/ONLINE` sono dimensioni
  indipendenti. Non comprimerle in un solo enum o booleano.
- Abilitare Wi-Fi non apre automaticamente OTA o console remota.
- Update scrive soltanto lo slot secondario; una perdita di collegamento non cancella
  l'immagine confermata.
- L'attuale device-ID storage provider non è una root of trust contro attacchi fisici.
  eFuse, Secure Boot, Flash Encryption e debug policy restano qualifica di produzione.

Per gli incidenti già incontrati e le soluzioni adottate consulta
[`DIARIO_PROBLEMI_SOLUZIONI_E_DECISIONI.md`](DIARIO_PROBLEMI_SOLUZIONI_E_DECISIONI.md).

## Ordine consigliato per il primo contributo

Per un nuovo Module: README del componente, header/config, callback pure, context e
I/O, Registry/Kconfig/CMake, test fake, Config CBOR, Data/Runtime, prova hardware.

Per un nuovo Core: schema, directory board, DTS/binding, pinctrl/controller,
sysbuild, ispezione dei file generati, flash/console, Port 1:N, networking e
qualificazione update.

Se durante il lavoro non sai dove collocare una modifica, usa questa regola:

> Lo schema decide cosa esiste fisicamente; Port lo espone senza dettagli di board;
> il Module Driver conosce il protocollo; Registry conosce i tipi compilati; Module
> Manager possiede le istanze; Config descrive lo stato desiderato; Runtime decide
> quando usarle; Data e Communication portano risultati e richieste.

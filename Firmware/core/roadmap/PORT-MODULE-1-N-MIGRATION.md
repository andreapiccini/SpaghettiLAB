# Migrazione architetturale: una Port, più Module

[← Indice roadmap](README.md) · [Architettura](../ARCHITECTURE.md)

## Problema corretto

La roadmap precedente usava la Port sia come connessione fisica sia come identità del
Module. Da questa sovrapposizione derivavano quattro regole errate:

1. una Port veniva marcata occupata dopo il primo Module;
2. `get_by_port()` prometteva un solo risultato;
3. Config rifiutava due elementi con lo stesso `port_id`;
4. Discovery conservava una sola proposta e una sola generazione per Port.

Una Port I2C è invece un accesso condiviso al controller. INA219 `0x40`, INA219 `0x41`
e SHT40 `0x44` sono tre istanze diverse sulla stessa Port 0. La Port serializza le
transazioni sul bus; non possiede né limita il numero di Module.

## Nuovo modello

### Identità logica e identità hardware

Ogni elemento Config riceve una chiave stabile non nulla:

```c
typedef uint32_t spaghetti_module_key_t;
```

La `module_key` identifica l’elemento desiderato fra reboot e riconciliazioni. Non è il
Module ID: `spaghetti_module_id_t` resta un handle runtime assegnato dal Manager e può
cambiare quando uno slot viene ricreato.

Il driver traduce la propria Config in un endpoint confrontabile:

```c
enum spaghetti_module_endpoint_kind {
	SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE,
	SPAGHETTI_ENDPOINT_I2C_ADDRESS,
	SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT,
};

struct spaghetti_module_endpoint {
	enum spaghetti_module_endpoint_kind kind;
	uint32_t value;
};
```

Per INA219 `kind` è `I2C_ADDRESS` e `value` è l’indirizzo 7-bit. Due Module possono
condividere `port_id` se gli endpoint non collidono. Un endpoint `PORT_EXCLUSIVE`
confligge con qualsiasi altra istanza sulla stessa Port. Due endpoint con stesso
`port_id`, `kind` e `value` confliggono anche se i `type_id` sono diversi.

La coppia chiave/tuple ha due scopi diversi:

- `module_key` è il riferimento stabile usato da Config, regole e Discovery;
- Port + driver + Config normalizzata descrivono l’istanza fisica; l’endpoint estratto
  dai parametri impedisce di rappresentare due volte lo stesso dispositivo.

### Context deterministico senza buffer universale

`SPAGHETTI_MODULE_CONTEXT_SIZE` viene eliminato. Una dimensione massima globale spreca
RAM per i driver piccoli, deve cambiare quando arriva un driver più grande e accoppia il
Manager ai dettagli privati dei driver.

Ogni driver definisce invece un pool statico tipizzato, preferibilmente con
`K_MEM_SLAB_DEFINE`:

```c
struct ina219_context {
	const struct device *i2c;
	struct spaghetti_ina219_config config;
	uint16_t calibration;
	bool initialized;
};

K_MEM_SLAB_DEFINE(ina219_context_slab,
		  sizeof(struct ina219_context),
		  CONFIG_SPAGHETTI_INA219_MAX_INSTANCES,
		  __alignof__(struct ina219_context));
```

`init()` alloca con `k_mem_slab_alloc(..., K_NO_WAIT)`, copia la Config e assegna
`module->context` solo dopo la validazione. `deinit()` azzera i dati sensibili, libera
il blocco e rimette il puntatore a `NULL`. Un fallimento parziale di `init()` libera il
blocco prima di restituire. La capacità è nota a build-time, il tempo è limitato e non
c’è heap né frammentazione.

Il Manager conserva un pool statico di soli slot Module:

```c
struct spaghetti_module_slot {
	bool used;
	bool reserved;
	bool busy;
	spaghetti_port_id_t port_id;
	uint32_t revision;
	struct spaghetti_module module;
};

static struct spaghetti_module_slot slots[CONFIG_SPAGHETTI_MAX_MODULES];
```

`reserved` impedisce collisioni durante init; `busy` serializza read/remove della
singola istanza mentre il mutex non viene trattenuto durante l'I/O. Nessuno dei due
flag è visibile fuori dal Manager.

### API Manager finali

```c
struct spaghetti_module_request {
	spaghetti_module_key_t key;
	spaghetti_port_id_t port_id;
	const char *type_id;
	const void *driver_config;
	size_t driver_config_size;
	uint32_t revision;
};

int spaghetti_module_manager_configure(
	const struct spaghetti_module_request *request,
	spaghetti_module_id_t *out_id);
int spaghetti_module_manager_remove(spaghetti_module_id_t id,
				    uint32_t expected_revision);
int spaghetti_module_manager_get_by_id(
	spaghetti_module_id_t id,
	struct spaghetti_module_snapshot *out);
int spaghetti_module_manager_get_by_key(
	spaghetti_module_key_t key,
	struct spaghetti_module_snapshot *out);
int spaghetti_module_manager_list_by_port(
	spaghetti_port_id_t port_id,
	struct spaghetti_module_snapshot *out,
	size_t capacity,
	size_t *out_count);
```

`get_by_port()` viene rimosso perché il suo risultato singolo è ambiguo. Le letture e i
comandi continuano a usare il Module ID runtime. Config e Runtime risolvono riferimenti
persistenti con `get_by_key()`; diagnostica e UI usano `list_by_port()`.

### Operazioni pure richieste al driver

```c
int (*validate_config)(const void *config, size_t config_size);
int (*describe_endpoint)(const void *config, size_t config_size,
			 struct spaghetti_module_endpoint *out);
```

Queste callback non accedono all’hardware e non modificano stato. Permettono a Config e
Manager di validare dimensione, range e collisioni prima di occupare uno slot o
allocare un context. Registry rifiuta un driver privo di queste operazioni.

## Modifiche richieste al codice già presente

Questa sezione è un report operativo; nessuna modifica è applicata automaticamente.

| File | Parte da cambiare | Motivo |
|---|---|---|
| `include/spaghetti/module.h:22-35` | Conservare qui una sola dichiarazione di `spaghetti_module_id_t`; aggiungere `spaghetti_module_key_t`, endpoint e key/endpoint alla Module/snapshot | Port non identifica più un’istanza. |
| `include/spaghetti/module_driver.h:16-20` | Aggiungere `validate_config` e `describe_endpoint`; lasciare il context opaco; eliminare il typedef duplicato alle righe 31-34 | Il Manager non deve interpretare address o struct private e l’ID deve avere un solo owner pubblico. |
| `include/spaghetti/module_manager.h:10-17` | Rimuovere la struct slot pubblica e il buffer universale | Slot e storage privato del driver non sono API. |
| `include/spaghetti/module_manager.h:33-71` | Sostituire la vecchia `configure(port_id, type_id, out_id)` e rimuovere `get_by_port()`; dichiarare request, snapshot, `get_by_key()` e `list_by_port()` | Config deve passare key e parametri driver; una Port produce zero, uno o molti risultati. |
| `subsys/module_manager/module_manager.c:5-15` | Conservare privatamente lo slot ma eliminare `driver_context.bytes[SPAGHETTI_MODULE_CONTEXT_SIZE]` | Il context passa al pool statico del driver concreto. |
| `subsys/module_manager/module_manager.c:23-31` | Ricevere `const struct spaghetti_module_request *request` e `out_id` | La richiesta deve trasportare key, Port, type, config, size e revision in un solo oggetto validabile. |
| `subsys/module_manager/module_manager.c:44-49` | Eliminare l’intero controllo `slots[i].module.port == port` che restituisce `-EBUSY` | Blocca erroneamente il secondo indirizzo I2C sulla stessa Port. |
| `subsys/module_manager/module_manager.c:64-113` | Cercare collisioni per key ed endpoint, poi trovare uno slot libero indipendentemente dalla Port; non assegnare `slot->driver_context.bytes` | La capacità è il numero globale di Module e il context appartiene al driver. |
| `subsys/module_manager/module_manager.c:116-125` | Sostituire gli stub `get_by_port()`/`read()` con get/list/remove/read descritti in TASK-070 | Una query singolare è ambigua e ogni operazione deve validare ID, revisione e stato. |
| `spaghetti_modules/ina219/ina219.c:9-10` | Rimuovere `DEVICE_DT_GET(DT_NODELABEL(ina219_test))` nella fase 080 | La scorciatoia statica impedisce address e istanze runtime. |
| `spaghetti_modules/ina219/ina219.c:12-22` | Aggiungere le callback pure all’operation table | Manager deve conoscere l’endpoint senza inizializzare hardware. |
| `spaghetti_modules/ina219/ina219.c:24-128` | Validare/copiare config, allocare uno `ina219_context` dallo slab, usare `spaghetti_port_i2c_device()` e API I2C dirette con address runtime; liberare lo slab in deinit | Consente `0x40` e `0x41` contemporaneamente sullo stesso controller senza heap. |
| `subsys/driver_registry/driver_registry.c:11-47` | Validare le due nuove callback; confrontare soltanto coppie con `jdx = idx + 1U` | Ogni driver deve descrivere la propria identità fisica e non confrontarsi con sé stesso. |
| futuri `config.c` e `discovery.c` | Indicizzare per module key, non per Port | Più desired/proposed Module possono condividere la stessa Port. |

Nel codice osservato, il controllo esclusivo è nel blocco commentato “Check that the
Port is not already occupied” di `module_manager.c`; è la prima parte da rimuovere
quando si riprende TASK-070. `module_manager.h` espone inoltre la struct slot e il buffer
context: entrambi devono diventare privati o sparire secondo il contratto sopra.

## Task completati e revisione

Le fasi segnate DONE sono 000–040:

- 000 Baseline, 010 Core e 020 I2C non dipendono dalla cardinalità e non richiedono
  cambi di codice;
- 030 Port resta corretta se rappresenta capacità/device e serializza il bus, senza
  flag occupied o owner Module; la documentazione viene esplicitata;
- 040 INA219 è una vertical slice temporanea con una sola istanza statica. Rimane una
  prova hardware valida e non definisce la cardinalità finale; la scorciatoia viene
  comunque rimossa in 080 come già previsto.

Le implementazioni parziali locali di 050–070 richiedono invece le modifiche della
tabella precedente anche se i relativi task sono ancora TODO nella roadmap.

## Flusso runtime 1:N

1. Port 0 espone un controller I2C condiviso e un lock di transazione.
2. Config contiene tre chiavi distinte con Port 0 e config driver `0x40`, `0x41`,
   `0x44`.
3. Discovery produce tre eventi UPSERT distinti, indicizzati per chiave.
4. Manager risolve driver e Port per ogni richiesta.
5. `describe_endpoint()` produce tre endpoint I2C distinti; nessuna Port è occupata.
6. Manager riserva tre slot Module e ogni driver riserva un blocco dal proprio slab.
7. Le tre init accedono allo stesso device I2C attraverso Port, una transazione alla
   volta, e diventano READY indipendentemente.
8. Runtime risolve le chiavi nei Module ID correnti e richiede read/command per ID.
9. Ogni driver acquisisce il bus tramite Port, usa il proprio address e restituisce il
   proprio sample.
10. Una Config che rimuove solo la chiave del Module `0x41` esegue deinit e libera quel
    context/slot; `0x40` e `0x44` restano READY sulla stessa Port.

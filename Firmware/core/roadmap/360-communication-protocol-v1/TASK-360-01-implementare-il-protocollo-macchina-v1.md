# TASK-360-01 — Implementare il protocollo macchina V1

**Stato:** ⬜ TODO
**Fase:** 360 — Communication Protocol V1

## Cosa devo fare

### 1. Definire envelope e operazioni indipendenti dal trasporto

Crea `include/spaghetti/protocol.h`, `subsys/communication/protocol_cbor.c` e aggiorna
`include/spaghetti/communication.h`:

```c
#define SPAGHETTI_PROTOCOL_VERSION 1U
#define SPAGHETTI_PROTOCOL_PAYLOAD_MAX 2048U

enum spaghetti_protocol_operation {
	SPAGHETTI_PROTOCOL_GET_CATALOG = 1,
	SPAGHETTI_PROTOCOL_GET_STATUS = 2,
	SPAGHETTI_PROTOCOL_APPLY_CONFIG = 3,
	SPAGHETTI_PROTOCOL_LIST_DISCOVERY = 4,
	SPAGHETTI_PROTOCOL_SCAN_DISCOVERY = 5,
	SPAGHETTI_PROTOCOL_ACCEPT_DISCOVERY = 6,
	SPAGHETTI_PROTOCOL_MODULE_COMMAND = 7,
	SPAGHETTI_PROTOCOL_GET_UPDATE_STATUS = 8,
};

struct spaghetti_protocol_payload {
	size_t size;
	uint8_t bytes[SPAGHETTI_PROTOCOL_PAYLOAD_MAX];
};

struct spaghetti_protocol_request {
	uint16_t version;
	uint32_t correlation_id;
	enum spaghetti_protocol_operation operation;
	struct spaghetti_protocol_payload payload;
};

struct spaghetti_protocol_response {
	uint16_t version;
	uint32_t correlation_id;
	int32_t status;
	struct spaghetti_protocol_payload payload;
};
```

Ogni envelope possiede il payload. `correlation_id` viene copiato esattamente nella
risposta anche quando l'operazione restituisce errno. L'enum C non viene serializzato:
il codec usa i numeri espliciti mostrati sopra.

Il CBOR canonico è:

```cddl
request  = { 0: 1, 1: uint, 2: uint, 3: bstr }
response = { 0: 1, 1: uint, 2: int,  3: bstr }
event    = { 0: 1, 1: uint, 2: uint, 3: bstr }
```

Esponi encode/decode request/response con buffer, capacity e written size. Rifiuta
versione sconosciuta, payload oltre 2048, chiavi duplicate/extra, trailing bytes e
correlation zero. Gli output cambiano solo al successo.

### 2. Registrare operation handler come plug-in

```c
enum spaghetti_permission {
	SPAGHETTI_PERMISSION_READ = BIT(0),
	SPAGHETTI_PERMISSION_CONFIGURE = BIT(1),
	SPAGHETTI_PERMISSION_COMMAND = BIT(2),
	SPAGHETTI_PERMISSION_DISCOVER = BIT(3),
	SPAGHETTI_PERMISSION_UPDATE = BIT(4),
	SPAGHETTI_PERMISSION_PROVISION = BIT(5),
};

struct spaghetti_request_context {
	uint32_t permissions;
	bool authenticated;
	bool local;
	enum spaghetti_core_mode core_mode;
};

struct spaghetti_operation_handler {
	enum spaghetti_protocol_operation operation;
	uint32_t required_permissions;
	int (*execute)(const struct spaghetti_request_context *context,
		       const struct spaghetti_protocol_payload *request,
		       struct spaghetti_protocol_payload *response);
};

#define SPAGHETTI_OPERATION_HANDLER_DEFINE(name) \
	const STRUCT_SECTION_ITERABLE(spaghetti_operation_handler, name)
```

Handler e descriptor hanno lifetime firmware. Context e payload request sono borrowed;
response è caller-owned e scritto solo al successo. Communication trova l'handler in
iterable section, verifica permessi prima di chiamarlo e non conosce il trasporto.

### 3. Implementare gli otto handler bounded

Dividi `subsys/communication/operations/` per owner:

- catalog: pagina driver/rule/provider e relativi schemi con cursor+limit;
- status: Core, Port, Module, schedule e service status;
- apply config: payload è Config CBOR V2 completa;
- list discovery: pagina candidati;
- scan: Port più policy non invasiva/invasiva;
- accept: candidate ID, key, generation; costruisce/applica nuova Config completa;
- module command: stable target key, command ID e property arguments;
- update status: snapshot read-only.

La paginazione evita risposte oltre 2048 byte. Ogni pagina restituisce `next_cursor` o
zero. Module command risolve key in ID soltanto durante la chiamata; non espone ID
effimeri come identità persistente.

### 4. Dare a ogni adapter una policy costante

Sostituisci il vecchio `spaghetti_request` V0 con:

```c
int spaghetti_communication_handle_request(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_request *request,
	struct spaghetti_protocol_response *response);
```

Le policy non arrivano dalla rete. Sono `static const` nell'adapter:

- USB Shell in Maintenance: tutti i permessi;
- USB Shell in Normal: read/configure/command/discover/update, provisioning sensibile
  continua a richiedere transizione Maintenance;
- Remote Console TLS: read/configure/command/discover, mai provision;
- futuro MQTT: read/configure/command/discover secondo credenziale;
- Maintenance UART SMP: update/provision soltanto per i command group dedicati.

Mantieni i comandi Shell umani, ma falli costruire request Protocol V1. La Remote
Console può mantenere la grammatica testuale per debug, ma usa gli stessi handler.

### 5. Pubblicare eventi macchina

Aggiungi:

```c
enum spaghetti_protocol_event_type {
	SPAGHETTI_PROTOCOL_EVENT_RECORD = 1,
	SPAGHETTI_PROTOCOL_EVENT_STATUS = 2,
	SPAGHETTI_PROTOCOL_EVENT_DISCOVERY = 3,
};

int spaghetti_protocol_encode_event(
	enum spaghetti_protocol_event_type type,
	uint32_t sequence,
	const struct spaghetti_protocol_payload *payload,
	uint8_t *buffer,
	size_t capacity,
	size_t *written_size);
```

Record, status e candidate hanno codec payload separati e bounded. Il catalogo spiega
field ID/schema; gli eventi non ripetono descrittori completi.

### 6. Testare indipendenza dal trasporto

Aggiorna `tests/communication` e crea `tests/protocol`. Lo stesso request encoded deve
produrre byte response identici attraverso fake USB, fake TLS e fake MQTT. Copri
permission denied, handler duplicato, operation unknown, paginazione, payload massimo,
malformed CBOR, command stable key e correlation preservation.

## Perché è fatto così

Protocollo, operazione e trasporto sono tre livelli diversi. Un envelope comune evita
che MQTT, USB e app acquisiscano semantiche divergenti. Handler iterable consentono
nuove operazioni senza un grande switch; context costante impedisce al peer di
auto-assegnarsi permessi.

## Come si usa

Un client legge il catalogo, costruisce Config/comandi usando nomi e field ID, invia
CBOR su un adapter e abbina la risposta tramite correlation ID. La Shell resta comoda
per una persona ma non è più il protocollo dell'app.

## Checklist di completamento

- [ ] Envelope V1 ha encoding canonico e limite 2048 byte.
- [ ] Otto operation handler sono auto-registrati e paginati.
- [ ] Permessi dipendono dall'adapter, non dalla richiesta.
- [ ] Shell e Remote Console passano da Communication V1.
- [ ] Eventi record/status/discovery hanno codec bounded.
- [ ] Tre fake transport producono lo stesso risultato.

## Verifica e fine task

```sh
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/protocol -T tests/communication \
  -T tests/remote_console -p native_sim/native/64 \
  --inline-logs --clobber-output'
make pristine
```

Il risultato atteso è un protocollo macchina stabile che non espone Zephyr Shell né
dettagli C nei payload.

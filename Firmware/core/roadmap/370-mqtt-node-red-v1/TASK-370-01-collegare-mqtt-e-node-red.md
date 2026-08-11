# TASK-370-01 — Collegare MQTT e Node-RED

**Stato:** ⬜ TODO
**Fase:** 370 — MQTT per Node-RED V1

## Cosa devo fare

### 1. Definire identità e topic stabili

Estendi `struct spaghetti_mqtt_config` in `include/spaghetti/mqtt.h`:

```c
enum spaghetti_mqtt_security {
	SPAGHETTI_MQTT_SECURITY_TLS_SERVER,
	SPAGHETTI_MQTT_SECURITY_TLS_MUTUAL,
	SPAGHETTI_MQTT_SECURITY_PLAINTEXT_DEVELOPMENT,
};

struct spaghetti_mqtt_config {
	bool enabled;
	char host[SPAGHETTI_MQTT_HOST_SIZE];
	uint16_t port;
	char core_id[SPAGHETTI_MQTT_CORE_ID_SIZE];
	char base_topic[SPAGHETTI_MQTT_BASE_TOPIC_SIZE];
	enum spaghetti_mqtt_security security;
	uint16_t credential_id;
};
```

`core_id` è identità pubblica configurata, non password e non puntatore. `credential_id`
seleziona un record secure storage senza mettere CA/password/private key nella Config.
Plaintext è compilabile soltanto con
`CONFIG_SPAGHETTI_MQTT_ALLOW_PLAINTEXT_DEVELOPMENT=y`, default `n` nelle board di
produzione.

Topic V1, tutti sotto `<base>/v1/cores/<core_id>`:

```text
/state                         retained QoS 1
/catalog                       retained QoS 1, paginato
/modules/<key>/records         QoS 0, non retained
/discovery                     QoS 1, non retained
/requests/<client_id>          subscribe QoS 1
/responses/<client_id>         publish QoS 1
```

Payload sono gli envelope/eventi CBOR della fase 360. Non creare JSON differente nel
firmware; il flow Node-RED traduce CBOR in oggetti JavaScript.

### 2. Provisionare credenziali senza Config o log

Crea `include/spaghetti/mqtt_credentials.h` e backend PSA ITS simile alle credenziali
console, ma con namespace e lifecycle separati:

```c
int spaghetti_mqtt_credentials_set(
	uint16_t credential_id,
	const uint8_t *ca,
	size_t ca_size,
	const uint8_t *client_certificate,
	size_t client_certificate_size,
	const uint8_t *private_key,
	size_t private_key_size);
int spaghetti_mqtt_credentials_clear(uint16_t credential_id);
int spaghetti_mqtt_credentials_exists(
	uint16_t credential_id,
	bool *out_exists);
```

Buffer sono borrowed e mai loggati; set è ammesso soltanto dalla Maintenance locale.
TLS server richiede CA e hostname verification; mutual richiede anche certificato e
chiave. Output exists cambia solo al successo. Capacità certificate/Kconfig è bounded.

### 3. Rendere MQTT bidirezionale

Apri `subsys/services/mqtt/mqtt.c`. Il worker:

1. connette e sottoscrive request topic;
2. pubblica state/catalog retained dopo ogni reconnect;
3. trasforma record/discovery in eventi Protocol V1;
4. riceve request, verifica topic/client ID/dimensione;
5. costruisce context MQTT autenticato con permessi read/configure/command/discover;
6. chiama `spaghetti_communication_handle_request()`;
7. pubblica sempre una response correlata, anche con errno dominio.

Conserva una cache bounded degli ultimi correlation ID per client. Un duplicato QoS 1
ripubblica la risposta precedente senza riapplicare Config/comando. Client ID ha limite
32 e viene validato prima di costruire il topic. Nessun callback MQTT esegue Config o
Manager: copia la request in una queue e lascia lavorare il thread owner.

### 4. Gestire rete assente e backpressure

Record QoS 0 possono essere scartati con contatore quando offline/coda piena; state e
response QoS 1 hanno pool separato e priorità. Config/command non vengono mai
silenziosamente scartati. Reconnect usa backoff bounded con jitter. Un certificato
errato, hostname errato o broker non autenticato lascia MQTT DEGRADED senza fermare
Runtime/USB.

### 5. Fornire un flow Node-RED di riferimento

Crea `examples/node_red/spaghetti_v1_flow.json` e README. Il flow:

- sottoscrive state/catalog/records/discovery;
- decodifica CBOR;
- mantiene una mappa schema/field ID → nome/unità;
- mostra due schemi diversi in debug/dashboard;
- genera correlation ID;
- invia GET_STATUS, APPLY_CONFIG e MODULE_COMMAND;
- abbina response e mostra errno leggibile;
- non contiene broker password, PSK o certificati.

Il flow è esempio/importabile, non owner della logica firmware.

## Perché è fatto così

Node-RED usa MQTT come trasporto, non come seconda API. Topic isolano Core/client,
Protocol V1 conserva semantica e correlation, catalogo rende i dati espandibili.
Separare credenziali da Config evita che snapshot, log o payload applicativi contengano
segreti.

## Come si usa

Provisiona credential in Maintenance, applica MQTT Config, importa il flow e imposta
solo broker/core ID nel deployment Node-RED. I nuovi driver compaiono nel catalogo e i
record vengono interpretati senza cambiare `mqtt.c`.

## Checklist di completamento

- [ ] Topic V1 e QoS sono documentati e stabili.
- [ ] TLS verifica CA e hostname; mutual TLS è supportato.
- [ ] Credenziali sono provisionate soltanto localmente.
- [ ] Request duplicate non ripetono effetti.
- [ ] Backpressure record non blocca response/state.
- [ ] Flow Node-RED gestisce catalogo, record, Config e comando.

## Verifica e fine task

```sh
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/mqtt -T tests/communication \
  -p native_sim/native/64 --inline-logs --clobber-output'
make pristine
```

Con un broker TLS di test, verifica CA/hostname corretti, CA errata, reconnect,
duplicate request e due record schema differenti. Il risultato atteso è Node-RED
operativo senza dipendenze INA219 nel servizio MQTT.

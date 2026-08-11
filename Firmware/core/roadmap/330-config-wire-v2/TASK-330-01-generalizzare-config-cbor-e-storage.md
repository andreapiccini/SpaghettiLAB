# TASK-330-01 — Generalizzare Config, CBOR e Storage

**Stato:** ⬜ TODO
**Fase:** 330 — Config e wire V2

## Cosa devo fare

### 1. Rendere Config completamente tipizzata ma non concreta

Apri `include/spaghetti/config.h`. Porta la versione in-memory a 4 e sostituisci i
byte driver con property set:

```c
#define SPAGHETTI_CONFIG_VERSION 4U
#define SPAGHETTI_CONFIG_MAX_MODULES 8U
#define SPAGHETTI_CONFIG_MAX_SCHEDULES 8U
#define SPAGHETTI_CONFIG_MAX_RULES 8U

struct spaghetti_module_config {
	spaghetti_module_key_t key;
	spaghetti_port_id_t port_id;
	char type_id[SPAGHETTI_CONFIG_TYPE_ID_SIZE];
	struct spaghetti_property_set properties;
};

struct spaghetti_runtime_schedule_config {
	bool enabled;
	spaghetti_module_key_t source_key;
	uint32_t period_ms;
};

struct spaghetti_rule_config {
	spaghetti_module_key_t key;
	char type_id[SPAGHETTI_CONFIG_TYPE_ID_SIZE];
	struct spaghetti_property_set properties;
};

struct spaghetti_config {
	uint32_t version;
	size_t module_count;
	struct spaghetti_module_config modules[SPAGHETTI_CONFIG_MAX_MODULES];
	size_t schedule_count;
	struct spaghetti_runtime_schedule_config
		schedules[SPAGHETTI_CONFIG_MAX_SCHEDULES];
	size_t rule_count;
	struct spaghetti_rule_config rules[SPAGHETTI_CONFIG_MAX_RULES];
	struct spaghetti_mqtt_config mqtt;
};
```

Config possiede ogni valore e non conserva puntatori. Più schedule sostituiscono la
singola sorgente. La vecchia `threshold_rule` concreta sparisce dal modello centrale;
la fase 340 la migra in un rule driver.

### 2. Definire il contratto dei rule driver prima di validarli

Crea `include/spaghetti/rule_driver.h` e `subsys/rule_registry/` con Registry basato
su iterable sections, come i Module Driver:

```c
struct spaghetti_rule_action {
	spaghetti_module_key_t target_key;
	struct spaghetti_module_command command;
};

typedef int (*spaghetti_rule_emit_action_cb_t)(
	const struct spaghetti_rule_action *action,
	void *user_data);

struct spaghetti_rule_driver_ops {
	int (*validate_config)(const struct spaghetti_property_set *config);
	int (*init)(const struct spaghetti_property_set *config, void **out_context);
	int (*on_record)(void *context,
			 const struct spaghetti_record *record,
			 spaghetti_rule_emit_action_cb_t emit,
			 void *emit_user_data);
	int (*deinit)(void *context);
};

struct spaghetti_rule_driver {
	const char *type_id;
	uint16_t api_version;
	const struct spaghetti_schema_descriptor *config_schema;
	const struct spaghetti_rule_driver_ops *ops;
};
```

`init()` assegna context da una slab posseduta dal rule driver e scrive `out_context`
solo al successo. Runtime possiede l'istanza logica e chiama `deinit()`. `on_record()`
non comanda Manager direttamente: emette una action copied e Runtime decide come
applicarla. Aggiungi macro `SPAGHETTI_RULE_DRIVER_DEFINE(name)` e lookup/count/get. In
questa fase un fake prova il Registry; la soglia concreta arriva nella fase 340.

### 3. Definire il wire CBOR V2 canonico

Conserva i decoder legacy wire 1/2 in `subsys/config/config_cbor_legacy.c`. Crea
`subsys/config/spaghetti_config_v2.cddl` con wire version 3:

```cddl
spaghetti-config-v2 = {
  0: 3,
  1: [* module],
  2: [* schedule],
  3: [* rule],
  4: mqtt
}
module = { 0: uint, 1: uint, 2: tstr, 3: properties }
schedule = { 0: uint, 1: uint, 2: bool }
rule = { 0: uint, 1: tstr, 2: properties }
properties = { * uint => (bool / int / uint / bstr) }
```

Chiavi property sono field ID; tipo CBOR viene convertito nel relativo
`spaghetti_value_type`. Rifiuta float, testo driver, mappe annidate, duplicati, più di
otto campi e trailing bytes. Dopo il decode, Config trova driver/rule descriptor e
valida con lo schema e `ops->validate_config()`; `config_cbor.c` non include header di
driver concreti.

Aggiorna `include/spaghetti/config_codec.h`:

```c
#define SPAGHETTI_CONFIG_CBOR_MAX_SIZE 2048U

int spaghetti_config_decode_cbor(
	const uint8_t *bytes,
	size_t length,
	struct spaghetti_config *out);
int spaghetti_config_encode_cbor(
	const struct spaghetti_config *config,
	uint8_t *buffer,
	size_t buffer_capacity,
	size_t *written_size);
```

Encode valida prima, produce sempre wire V2 canonico, ordina root/field ID in modo
deterministico e scrive buffer/written solo al successo. Restituisce `-EINVAL`,
`-EMSGSIZE`, `-EBADMSG`, `-ENOTSUP`, `-ENOENT`, `-EEXIST`, `-EADDRINUSE`, `-ERANGE`.

### 4. Riconciliare Module, schedule e rule in una transazione

Apri `subsys/config/config.c`. Moduli invariati per key restano vivi solo se Port,
type e property set coincidono. Schedule riferiscono una key esistente con op `read`;
rule type deve esistere nel Rule Registry. Valida tutto prima del primo cambiamento.

Apply esegue: stop Runtime, prepara nuovi Module, commit Config e Storage, configura le
schedule e riavvia Runtime. Su qualsiasi errore ripristina Module e schedule
precedenti. Generation aumenta solo al commit. Nessuna Port viene considerata occupata.

In questa fase Config decodifica, valida e conserva anche le rule, ma rifiuta con
`-ENOTSUP` un apply con `rule_count > 0`: il lifecycle dei context e il rollback delle
rule appartengono a Runtime e vengono implementati integralmente nel task 340
immediatamente successivo. È una limitazione intermedia esplicita, non un fallback
silenzioso. I payload senza rule e la migrazione della vecchia threshold restano
utilizzabili; il task 340 rimuove il rifiuto e completa la transazione.

### 5. Persistire byte canonici, non `struct spaghetti_config`

Apri `subsys/services/storage/storage.c`. Il record diventa:

```c
#define SPAGHETTI_STORAGE_RECORD_MAGIC_V2 0x53504732U

struct spaghetti_storage_record_v2 {
	uint32_t magic;
	uint16_t record_version;
	uint16_t payload_size;
	uint32_t payload_crc32;
	uint8_t payload[SPAGHETTI_CONFIG_CBOR_MAX_SIZE];
};
```

Write usa encoder, `crc32_ieee()`, azzera byte non usati e salva. Read verifica
lunghezza/CRC e decodifica in una temporanea. Non fa `loaded_record.config = ...`.

Isola il vecchio layout in `storage_legacy_v3.c`: riconosce esattamente magic/version
precedenti, converte INA219, Relay, sampling, threshold e MQTT nel nuovo modello e
risalva V2 solo dopo validazione. Se trova tipo/layout non convertibile restituisce
`-EPROTONOSUPPORT` e Core entra in Maintenance senza cancellare il record. Questo è il
solo file autorizzato a conoscere il vecchio layout concreto e va rimosso dopo una
release di migrazione documentata.

### 6. Testare compatibilità e perdita di alimentazione logica

Aggiorna `tests/config`, `config_codec`, `storage` e aggiungi `rule_registry`. Copri
round-trip deterministico, INA219/Relay generici, due schedule, fake rule, legacy
migration, CRC errato, record troncato, payload massimo, unknown type, rollback e
output immutato.

## Perché è fatto così

Il modello interno è condiviso da ogni trasporto, mentre CBOR è soltanto la forma
canonica wire/storage. Persistendo CBOR si eliminano padding, endianness e ABI delle
struct. Driver e rule validano le proprie proprietà; Config possiede soltanto il set
desiderato e la transazione.

## Come si usa

Un adapter decodifica CBOR e chiama `spaghetti_config_apply()`. Storage usa lo stesso
encoder. Un nuovo driver assegna field ID nel proprio schema e non richiede modifiche
al codec centrale.

## Checklist di completamento

- [ ] Config contiene Module, schedule e rule generici.
- [ ] CBOR V2 non contiene switch su driver/rule concreti.
- [ ] Encoder e decoder fanno round-trip canonico.
- [ ] Storage salva payload versionato con CRC.
- [ ] Il record precedente migra oppure fallisce senza perdita.
- [ ] Apply effettua rollback completo per Module/schedule e rifiuta rule non ancora eseguibili.

## Verifica e fine task

```sh
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/config -T tests/config_codec -T tests/storage \
  -T tests/rule_registry -p native_sim/native/64 \
  --inline-logs --clobber-output'
make pristine
```

Il risultato atteso è nessun riferimento concreto in `config_cbor.c`, Config corrente
preservata dalla migrazione e record corrotto mai applicato.

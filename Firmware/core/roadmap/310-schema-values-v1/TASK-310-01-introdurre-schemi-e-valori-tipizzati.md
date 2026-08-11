# TASK-310-01 — Introdurre schemi e valori tipizzati

**Stato:** ⬜ TODO
**Fase:** 310 — Schemi e valori V1

## Cosa devo fare

### 1. Creare il vocabolario comune

Crea `include/spaghetti/schema.h`, `subsys/schema/schema.c` e
`subsys/schema/README.md`; aggiungi `schema.c` al `CMakeLists.txt` applicazione.

Scrivi questi limiti pubblici:

```c
#define SPAGHETTI_SCHEMA_ID_SIZE 32U
#define SPAGHETTI_FIELD_NAME_SIZE 24U
#define SPAGHETTI_UNIT_NAME_SIZE 16U
#define SPAGHETTI_VALUE_BYTES_MAX 32U
#define SPAGHETTI_PROPERTY_MAX_FIELDS 8U
```

Poi definisci:

```c
enum spaghetti_value_type {
	SPAGHETTI_VALUE_BOOL,
	SPAGHETTI_VALUE_INT64,
	SPAGHETTI_VALUE_UINT64,
	SPAGHETTI_VALUE_BYTES,
};

struct spaghetti_bytes_value {
	size_t size;
	uint8_t bytes[SPAGHETTI_VALUE_BYTES_MAX];
};

struct spaghetti_value {
	uint16_t field_id;
	enum spaghetti_value_type type;
	union {
		bool boolean;
		int64_t signed_integer;
		uint64_t unsigned_integer;
		struct spaghetti_bytes_value bytes;
	} data;
};

struct spaghetti_property_set {
	size_t field_count;
	struct spaghetti_value fields[SPAGHETTI_PROPERTY_MAX_FIELDS];
};
```

La union è tagged da `type`: si legge soltanto il membro selezionato. `field_id` è
stabile nello schema e viene codificato come unsigned esplicito sul wire. INT64 e
UINT64 coprono fixed-point, timestamp e contatori senza float. BYTES serve per ROM,
identità e piccoli blob; testo di configurazione generale resta in strutture bounded
del relativo servizio, non viene trasformato in puntatore.

### 2. Descrivere i campi senza inserirli in ogni messaggio

```c
enum spaghetti_field_flags {
	SPAGHETTI_FIELD_REQUIRED = BIT(0),
	SPAGHETTI_FIELD_WRITABLE = BIT(1),
};

struct spaghetti_field_descriptor {
	uint16_t field_id;
	enum spaghetti_value_type type;
	uint32_t flags;
	int64_t signed_minimum;
	int64_t signed_maximum;
	uint64_t unsigned_minimum;
	uint64_t unsigned_maximum;
	uint8_t bytes_min_size;
	uint8_t bytes_max_size;
	const char *name;
	const char *unit;
};

struct spaghetti_schema_descriptor {
	const char *schema_id;
	uint16_t version;
	const struct spaghetti_field_descriptor *fields;
	size_t field_count;
};
```

Descrittori, stringhe e array sono `const` con lifetime firmware e appartengono al
plug-in che li definisce. Ogni tipo usa la propria coppia di limiti; i campi non
applicabili sono zero. Nome e unità devono stare nei limiti stringa pubblici.
`schema_id` è una stringa stabile come `"spaghetti.ina219.sample"`; `version` cambia
quando cambia un field ID, tipo o significato incompatibile.

### 3. Definire record e comando generici

Apri `include/spaghetti/module.h` e lascia identità/lifecycle. Sposta il vecchio
sample elettrico nel percorso legacy e aggiungi in `schema.h`:

```c
enum spaghetti_record_kind {
	SPAGHETTI_RECORD_SAMPLE,
	SPAGHETTI_RECORD_EVENT,
};

struct spaghetti_record_payload {
	enum spaghetti_record_kind kind;
	char schema_id[SPAGHETTI_SCHEMA_ID_SIZE];
	uint16_t schema_version;
	struct spaghetti_property_set values;
};

struct spaghetti_record {
	spaghetti_module_id_t source_id;
	spaghetti_module_key_t source_key;
	int64_t timestamp_ms;
	uint32_t sequence;
	struct spaghetti_record_payload payload;
};

struct spaghetti_module_command {
	uint16_t command_id;
	struct spaghetti_property_set arguments;
};
```

Payload e record possiedono tutti i byte. Il driver produce soltanto payload; Manager
e Runtime aggiungono key, ID, timestamp e sequence formando il record copiabile in
zbus. Il comando è borrowed durante una chiamata sincrona e contiene valori owned,
quindi non porta puntatori a stack attraverso code o trasporti.

Per descrivere più comandi nello stesso driver aggiungi:

```c
struct spaghetti_command_descriptor {
	uint16_t command_id;
	const char *name;
	const struct spaghetti_schema_descriptor *argument_schema;
};
```

Ogni command ID è stabile nel driver; lo schema argomenti può essere diverso dagli
altri comandi.

### 4. Implementare lookup e validazione una sola volta

Esponi:

```c
const struct spaghetti_value *spaghetti_property_find(
	const struct spaghetti_property_set *properties,
	uint16_t field_id);
int spaghetti_property_validate(
	const struct spaghetti_property_set *properties,
	const struct spaghetti_schema_descriptor *schema);
int spaghetti_record_payload_validate(
	const struct spaghetti_record_payload *payload,
	const struct spaghetti_schema_descriptor *schema);
int spaghetti_record_validate(
	const struct spaghetti_record *record,
	const struct spaghetti_schema_descriptor *schema);
```

`find()` restituisce un puntatore immutable borrowed con lifetime della property set o
NULL. `property_validate()` rifiuta puntatori nulli, count oltre capacità, field ID
zero/duplicati/sconosciuti, type mismatch, required assenti, flag sconosciuti, range e
BYTES oltre limite. `payload_validate()` verifica kind, schema ID/version e valori;
`record_validate()` aggiunge source, timestamp e sequence. Le funzioni restituiscono
`0`, `-EINVAL`, `-ENOENT`, `-EEXIST`, `-EMSGSIZE`, `-ERANGE` o
`-EPROTONOSUPPORT`; non modificano input.

### 5. Aggiungere test indipendenti

Crea `tests/schema/` con CMake, Kconfig, prj.conf, testcase e ztest. Copri ogni tipo,
min/max, required, duplicati, schema sbagliato, buffer massimo e output immutato.
Misura con `sizeof(struct spaghetti_record)` e documenta in `subsys/schema/README.md`
la RAM consumata da un elemento zbus prima di scegliere le capacità della fase 340.

## Perché è fatto così

I messaggi non possono contenere una union centrale per ogni sensore futuro e non
possono serializzare struct C. Una property set bounded offre tipi comuni; lo schema
immutabile aggiunge nomi, unità e limiti senza ripeterli in ogni sample. Node-RED può
leggere il catalogo una volta e interpretare i field ID successivi.

## Come si usa

Un driver definisce staticamente lo schema e produce `{field_id=1, UINT64=5000000}`.
Un adapter risolve field 1 nel catalogo come `bus_voltage_microvolts`. Un futuro
sensore definisce un altro schema senza modificare `schema.c`.

## Checklist di completamento

- [ ] Property set contiene solo valori owned e bounded.
- [ ] Descrittori hanno lifetime firmware e schema/version stabili.
- [ ] Record e comandi non contengono tipi INA219/Relay.
- [ ] Lookup e validazione coprono duplicati, required, tipi e range.
- [ ] Dimensione RAM del record è documentata.

## Verifica e fine task

```sh
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/schema -p native_sim/native/64 \
  --inline-logs --clobber-output'
make build
```

Il risultato atteso è uno schema completamente indipendente da driver e trasporti,
con zero allocazioni dinamiche.

# TASK-390-01 — Chiudere e qualificare la piattaforma V1

**Stato:** ⬜ TODO
**Fase:** 390 — Finalizzazione piattaforma V1

## Cosa devo fare

### 1. Provare che i punti di estensione sono reali

Crea `tests/v1_extension/` e mantieni tutti i plug-in sotto quella directory:

- `fake_temperature`: config I2C, record temperatura INT64, read sincrona;
- `fake_button`: config GPIO, record evento BOOL, start/stop asincroni;
- `fake_pwm`: config output, comando UINT64 duty permille;
- `fake_rule`: osserva un field e comanda PWM;
- `fake_eeprom_provider`: candidate autorevole;
- `fake_analog_provider`: candidate euristico.

Registrali con le macro iterable. Non modificare per la prova:

```text
subsys/driver_registry/
subsys/rule_registry/
subsys/config/
subsys/data/
subsys/runtime/
subsys/communication/
subsys/services/mqtt/
```

Il test applica JSON→CBOR con due Module sulla stessa Port, due schedule, una rule,
evento pulsante e comando PWM. Verifica catalogo, Data, MQTT fake e rollback.

### 2. Eseguire la pulizia rimasta dalla fase 210

Riesegui tutte le ricerche di
`roadmap/210-finalizzazione/TASK-210-01-ripulire-e-qualificare-il-firmware.md` adattate
ai nomi V2. Elimina legacy wrapper non più usati, sample elettrico centrale, comando
Relay centrale, Config threshold concreta, tabelle registry e storage raw struct.
Conserva `config_cbor_legacy.c`/`storage_legacy_v3.c` soltanto se la release di
migrazione li richiede e marca versione/data di rimozione.

Completa e marca nel task 210 tutte le verifiche software/fake. I casi che richiedono
INA219, Relay, fault elettrici o PCB non disponibili restano non eseguiti e vengono
copiati nel report hardware insieme alla fase 290; non marcarli PASS con una
simulazione. La platform V1 può essere congelata per Node-RED con questi gate elencati,
ma la release hardware 1.0 no.

### 3. Congelare il contratto V1

Aggiorna `ARCHITECTURE.md`, `EXTENDING_SPAGHETTI_LAB.md`, README componenti e crea
`PROTOCOL_V1.md`. Documenta:

- numeric operation/event IDs;
- CBOR envelope e Config wire version;
- topic MQTT;
- schema/field/command ID rules;
- permission matrix;
- error mapping;
- backward compatibility e deprecation;
- procedura per Module, rule, provider, Core e transport nuovi.

Dopo il freeze un cambiamento incompatibile richiede Protocol V2 o nuova schema
version. Non riutilizzare ID eliminati con un altro significato.

### 4. Misurare risorse e applicare limiti

Salva in `verification/v1/RESOURCE_BUDGET.md` per entrambe le board:

- flash app/MCUboot e spazio libero slot;
- RAM statica, heap TLS Zephyr e stack per thread;
- dimensione record/property/envelope;
- capacità queue/slab/cataloghi;
- massimo Module/schedule/rule/provider/client;
- tempo peggiore fake per apply, rollback e scan timeout.

Fallisci build con `BUILD_ASSERT` quando una relazione statica è invalida. Non ridurre
limiti silenziosamente in runtime.

### 5. Superare il gate Node-RED senza Module fisici

Avvia broker TLS di test e importa `examples/node_red/spaghetti_v1_flow.json`. Con
native/fake o board corrente:

1. Node-RED legge catalogo paginato;
2. applica Config con due fake Module sulla stessa Port;
3. riceve sample temperatura ed evento pulsante;
4. invia comando PWM con correlation ID;
5. vede candidato EEPROM e analogico distinti;
6. accetta soltanto quello autorevole;
7. riavvia e ritrova Config da Storage;
8. broker offline non ferma Runtime;
9. un nuovo fake schema aggiunto dopo il freeze compare senza patch centrali.

Registra risultati in `verification/v1/PLATFORM_REPORT.md` con commit, Zephyr, board e
comandi, senza segreti.

### 6. Separare “platform V1” da “release hardware 1.0”

Puoi marcare questo task DONE con fake e hardware corrente. Non impostare automaticamente
`VERSION=1.0.0`: la release hardware 1.0 richiede anche fase 290 completa, board PCB
definitiva, sicurezza production e prove elettriche del promemoria. Riporta questi gate
come aperti, non come bug del contratto software.

## Perché è fatto così

Un'architettura è espandibile solo se un test aggiunge tipi reali senza toccare il
centro. Il freeze permette a Node-RED e ai tool di evolvere contro un contratto stabile;
separare platform V1 da hardware release evita di dichiarare qualificate prove che
oggi non puoi eseguire.

## Come si usa

Dopo il task, il lavoro ordinario firmware per un nuovo Module resta confinato a
driver, schema, test e CMake/Kconfig. Node-RED scopre catalogo e usa protocollo/topic V1.
Nuovi Core aggiungono board/binding/backend Port senza branch applicativi.

## Checklist di completamento

- [ ] Sei plug-in fake attraversano il sistema senza patch centrali.
- [ ] Pulizia software 210 è conclusa e ogni caso hardware rinviato è tracciato.
- [ ] Protocol, Config wire, schema ID e MQTT topic V1 sono congelati.
- [ ] Resource budget delle due board è registrato.
- [ ] Gate Node-RED passa con broker TLS e reboot Storage.
- [ ] Limiti hardware/produzione restano esplicitamente aperti.

## Verifica e fine task

```sh
./validator roadmap
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests -p native_sim/native/64 \
  --inline-logs --outdir build/twister-v1 --clobber-output'
make pristine
BOARD=spaghettilab_core_v2_build_only/esp32c3 make build
.venv/bin/python -m unittest discover -s tools/tests -v
```

Il task termina quando il report V1 contiene zero failure, il flow Node-RED completa i
nove passi e l'aggiunta di un nuovo fake non modifica alcun sottosistema centrale.

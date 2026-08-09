# TASK-160-01 — Pubblicare i dati con MQTT

**Stato:** ⬜ TODO
**Fase:** 160 — MQTT

## Prima di scrivere: concetti Zephyr

### Abilitare la configurazione di rete minima

1. **Cos’è:** Lo stack di rete Zephyr comprende interfaccia, gestione eventi, IPv4, TCP, socket e servizi opzionali come DHCP e DNS.
2. **A cosa serve:** Fornisce a MQTT una connessione IP senza incorporare dettagli del driver Wi-Fi nel servizio MQTT.
3. **Quando viene usato:** Kconfig include i sottosistemi durante la build; interfaccia, indirizzo e socket diventano utilizzabili a runtime dopo gli eventi corretti.
4. **Build-time o runtime:** Selezione a build-time, connettività a runtime.
5. **Collegamento con questo task:** Il percorso di rete scelto nel task precedente determina quali sole opzioni devono essere abilitate.
6. **File reali coinvolti:** `prj.conf`; per capire le dipendenze usa l’help Kconfig della versione Zephyr installata.
7. **Cosa guardare nei file:** Verifica opzioni per interfaccia ESP32, networking, IPv4, TCP, socket e soltanto i servizi realmente necessari.
8. **Cosa non modificare:** Non copiare una configurazione di esempio completa, non inserire credenziali nel repository e non considerare `CONFIG_*=y` prova di connessione.

### Accodare la temperatura per un topic di sviluppo

La message queue disaccoppia il consumo di zbus dal lavoro in socket. La connessione
MQTT e l'elaborazione delle pubblicazioni appartengono alla thread, non ad una callback
zbus.

## Perché lo facciamo

Il worker MQTT possiede socket e reconnessione; Runtime si limita ad accodare copie limitate dei campioni.

## Implementazione guidata

### Passo 1 — Scegliere il percorso di rete per lo sviluppo

Apri `prj.conf` e `subsys/services/mqtt/README.md`. Il percorso di sviluppo fissato da
questo task è Wi-Fi station ESP32, indirizzo ottenuto con DHCPv4 e broker risolto con
DNS. SSID e password devono arrivare da configurazione locale non versionata.

Registrare se il test utilizza Wi-Fi, DHCP o IPv4, indirizzo DNS o broker numerico, e
come vengono fornite le credenziali di sviluppo senza commettere segreti. Non modificare
il firmware in questo task, che serve soltanto a documentare la decisione.

### Passo 2 — Abilitare la configurazione di rete minima

`prj.conf`.

Aggiungi `CONFIG_NETWORKING=y`, `CONFIG_WIFI=y`, `CONFIG_WIFI_ESP32=y`,
`CONFIG_NET_IPV4=y`, `CONFIG_NET_TCP=y`, `CONFIG_NET_SOCKETS=y`,
`CONFIG_NET_DHCPV4=y` e `CONFIG_DNS_RESOLVER=y`. Se il nome ESP32 differisce nella
versione installata, individua il simbolo selezionato dal driver della board in
`build/zephyr/.config`; non sostituirlo con un driver di un altro chip.

### Passo 3 — Implementare la segnalazione di rete pronta

`subsys/services/mqtt/mqtt.c`.

Registrare i callback necessari per la gestione della rete, tracciare lo stato link/IP e
segnalare il futuro MQTT worker solo dopo `NET_EVENT_IPV4_ADDR_ADD` o l'equivalente
scelto.

### Passo 4 — Definire l’API del servizio MQTT

Crea `subsys/services/mqtt/mqtt.h`.

Dichiarare le API `spaghetti_mqtt_init()` delimitate, `start()`, `publish_temperature()`
e `get_status()`. Definire gli ingressi endpoint/topic copiati, i limiti di carico e gli
stati di servizio senza esporre Zephyr MQTT interni.

### Passo 5 — Implementare worker MQTT e stato del client

Creare `subsys/services/mqtt/mqtt.c` e aggiornare `prj.conf`.

Abilita `CONFIG_MQTT_LIB=y`. Implementa uno MQTT di proprietà thread con buffer client
fissi, elaborazione socket poll/input/live, backoff di connessione e stato
connected/error esplicito. Non bloccare i produttori di dati.

### Passo 6 — Accodare la temperatura per un topic di sviluppo

`subsys/services/mqtt/mqtt.c` e `subsys/data/data.c`.

Crea uno `k_msgq` in uscita limitato. Crea MQTT subscriber format/copy carico di una
temperatura e enqueue con una politica nonblocking/full definita. Pubblicalo su un
argomento di sviluppo fisso dalla MQTT thread.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> La broker/topic fissa è intenzionalmente temporanea e verrà rimossa in
  [TASK-160-08](TASK-160-01-pubblicare-i-dati-con-mqtt.md).

### Passo 7 — Integrare e provare MQTT con topic fisso

`CMakeLists.txt`, `subsys/core/core.c`, MQTT e il broker di sviluppo.

Aggiungere le sorgenti MQTT a CMake, initialize/start il servizio dopo la preparazione
della rete, e osservare un argomento di temperatura presso il broker. L'assenza del
broker di prova, riconnettersi, e una coda completa in uscita con la politica
documentata.

### Passo 8 — Spostare le impostazioni MQTT in Config

`include/spaghetti/config.h`, `subsys/config/config.c`, i file di servizio CBOR
schema/codec e MQTT.

Aggiungi a Config solo flag, endpoint broker delimitato, porta e argomento base
delimitato. Bump e valida la versione schema CBOR, passa una configurazione MQTT copiata
attraverso la sua API, ed elimina ogni costante endpoint/topic fissa.

### Contratti completi da scrivere

```c
#define SPAGHETTI_MQTT_HOST_SIZE 64U
#define SPAGHETTI_MQTT_TOPIC_SIZE 96U
#define SPAGHETTI_MQTT_PAYLOAD_SIZE 64U
struct spaghetti_mqtt_config { bool enabled; char host[64]; uint16_t port; char base_topic[96]; };
struct spaghetti_mqtt_publication { char topic_suffix[32]; size_t payload_size; uint8_t payload[64]; };
enum spaghetti_mqtt_state { SPAGHETTI_MQTT_STOPPED, SPAGHETTI_MQTT_WAIT_NETWORK, SPAGHETTI_MQTT_CONNECTED, SPAGHETTI_MQTT_ERROR };
struct spaghetti_mqtt_status { enum spaghetti_mqtt_state state; uint32_t queued; uint32_t published; uint32_t dropped; int last_error; };
int spaghetti_mqtt_init(const struct spaghetti_mqtt_config *config);
int spaghetti_mqtt_start(void);
int spaghetti_mqtt_stop(k_timeout_t timeout);
int spaghetti_mqtt_publish(const struct spaghetti_mqtt_publication *publication);
int spaghetti_mqtt_get_status(struct spaghetti_mqtt_status *out);
```

Config e publication sono copiati: nessun puntatore del chiamante sopravvive alla
chiamata. `out` è una snapshot posseduta dal chiamante. Publish fa solo validazione e
`k_msgq_put(..., K_NO_WAIT)`; restituisce `-ENOMSG` se la coda è piena. Il worker
possiede `mqtt_client`, buffers, socket, DNS, connect, keepalive e reconnessione
limitata. Gli eventi di rete segnalano il worker e non eseguono socket I/O. Dopo la
prova con endpoint/topic fissi, aggiungi host/porta/topic a Config e rimuovi le costanti.

Campi principali:

- `enabled`: consente di compilare MQTT ma lasciarlo fermo da Config;
- `host`: array posseduto dal servizio dopo la copia, sempre NUL-terminato;
- `port`: numero TCP passato per valore; usa 1883 nello sviluppo senza TLS;
- `base_topic`: prefisso copiato, senza slash finale;
- `topic_suffix`: parte relativa della singola pubblicazione;
- `payload_size`: byte validi del payload, massimo 64;
- `state` e contatori: snapshot diagnostica, non oggetti Zephyr esposti.

`init(config)` valida e copia Config e crea coda/thread; `start()` accoda il comando di
connessione; `stop(timeout)` ferma reconnessione e attende ack; `publish(publication)`
valida e copia con `K_NO_WAIT`; `get_status(out)` copia sotto lock breve. I puntatori di
input sono `const` e prestati; `out` è scritto dal servizio e resta del chiamante.
Socket, `mqtt_client` e buffer restano privati di `mqtt.c`.

In `mqtt.c` registra la readiness IPv4 con una callback di questa forma:

```c
static void network_event_handler(struct net_mgmt_event_callback *callback,
				  uint64_t event,
				  struct net_if *iface)
{
	ARG_UNUSED(callback);
	ARG_UNUSED(iface);
	if (event == NET_EVENT_IPV4_ADDR_ADD) {
		k_sem_give(&network_ready_sem);
	}
}
```

Zephyr possiede i puntatori della callback; MQTT li prende in prestito e non li
conserva. La callback segnala soltanto il semaforo. Il thread MQTT attende il semaforo,
risolve `config.host`, apre il socket e guida connect, input e keepalive.

## Esempio d’uso

```c
struct spaghetti_mqtt_publication publication = {
	.topic_suffix = "temperature",
	.payload_size = payload_size,
};
memcpy(publication.payload, payload, payload_size);
int err = spaghetti_mqtt_publish(&publication);
```

## Checklist di completamento

- [ ] Scegliere il percorso di rete per lo sviluppo.
- [ ] Abilitare la configurazione di rete minima.
- [ ] Implementare la segnalazione di rete pronta.
- [ ] Definire l’API del servizio MQTT.
- [ ] Implementare worker MQTT e stato del client.
- [ ] Accodare la temperatura per un topic di sviluppo.
- [ ] Integrare e provare MQTT con topic fisso.
- [ ] Spostare le impostazioni MQTT in Config.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Prova rete assente, broker fermo, riconnessione e coda piena mentre Runtime continua a campionare. Il broker deve ricevere topic/payload configurati; nessuna credenziale va nei log o nel repository.

**Risultato atteso**

MQTT si riconnette senza bloccare Runtime e pubblica sul topic configurato senza segreti nei log.

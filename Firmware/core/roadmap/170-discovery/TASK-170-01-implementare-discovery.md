# TASK-170-01 — Implementare Discovery

**Stato:** ⬜ TODO
**Fase:** 170 — Discovery

## Perché lo facciamo

Discovery propone assegnazioni normalizzate, ma soltanto Manager crea e possiede le istanze Module.

## Implementazione guidata

### Passo 1 — Definire i tipi risultato di Discovery

`include/spaghetti/discovery.h`.

Definire la modalità MANUAL/AUTO/HYBRID, un enum sorgente indipendente dalla modalità, e
`spaghetti_discovery_result` contenente Port, dati limitati type/config, sorgente e
generazione. Mantenere esplicita la proprietà.

### Passo 2 — Definire l’API del provider Discovery

`include/spaghetti/discovery.h`.

Definisci la tabella delle operazioni del provider e dichiara le API per inizializzare
Discovery, presentare manualmente un risultato e registrare la callback che riceve i
risultati accettati. Non aggiungere un worker asincrono finché un provider reale non lo
richiede.

### Passo 3 — Implementare la validazione di Discovery manuale

`subsys/discovery/discovery.c`.

Implementa la convalida di invio MANUAL-only per modalità, Port, type/config limiti,
sorgente e generazione. Rifiuta le generazioni obsolete e chiama la callback registrata
solo dopo che il risultato completo valida.

### Passo 4 — Inviare i risultati accettati al Module Manager

`subsys/discovery/discovery.c`, `CMakeLists.txt` e `subsys/core/core.c`.

Implementa una callback che inoltra i risultati accettati all'API di configurazione già
esistente nel Module Manager
immutata. Aggiungi sorgente Discovery a CMake e inizializzalo da Core prima che Config
possa inviare le assegnazioni.

### Passo 5 — Instradare le assegnazioni Config tramite Discovery

`subsys/config/config.c`, Communication applicano il percorso e la console seriale.

Sostituire l'assegnazione diretta del Module Manager Config con un risultato di scoperta
manuale normalizzato. Mantenere Runtime e la configurazione del servizio diretta ai
rispettivi componenti responsabili. Verifica risultati validi, obsoleti, non validi e
con tipo sconosciuto.

### Contratti completi da scrivere

```c
enum spaghetti_discovery_mode { SPAGHETTI_DISCOVERY_MANUAL, SPAGHETTI_DISCOVERY_AUTO, SPAGHETTI_DISCOVERY_HYBRID };
enum spaghetti_discovery_source { SPAGHETTI_DISCOVERY_SOURCE_CONFIG, SPAGHETTI_DISCOVERY_SOURCE_PROVIDER };
struct spaghetti_discovery_result { spaghetti_port_id_t port_id; char type_id[16]; size_t config_size; uint8_t config[32]; enum spaghetti_discovery_source source; uint32_t generation; };
typedef int (*spaghetti_discovery_sink_t)(const struct spaghetti_discovery_result *result, void *user_data);
struct spaghetti_discovery_provider_ops {
	int (*run)(spaghetti_port_id_t port_id, k_timeout_t timeout,
		   struct spaghetti_discovery_result *out);
};
int spaghetti_discovery_init(spaghetti_discovery_sink_t sink, void *user_data);
int spaghetti_discovery_submit_manual(const struct spaghetti_discovery_result *result);
```

Il risultato è pubblico e copiabile; array e dimensioni rendono ownership indipendente
dal provider. `sink` è conservato fino al riavvio, quindi la funzione deve avere
lifetime firmware; `user_data` è opaco, non posseduto e deve vivere altrettanto.
`result` è prestato per la chiamata. Init restituisce `-EINVAL` per sink nullo; submit
valida Port, terminazione type, config_size, source e generation, rifiuta stale con
`-ESTALE`, poi invoca il sink. Il sink costruisce la richiesta Manager; Discovery non
possiede slot né chiama driver direttamente.

`port_id` identifica il connettore; `type_id` e `config` sono array perché Discovery
deve possedere una proposta completa; `config_size` limita i byte validi; `source`
distingue Config da provider; `generation` respinge risultati vecchi. La callback sink
riceve un risultato `const` preso in prestito e lo deve copiare se serve oltre il
ritorno. La callback provider `run` riceve Port e timeout per valore e scrive un output
del chiamante solo al successo. In questa fase implementa soltanto MANUAL: non creare
un provider automatico o un thread.

`init(sink, user_data)` azzera le generation per Port e conserva callback/context;
`submit_manual(result)` valida tutto, confronta generation, copia il risultato nello
stato privato, invoca il sink e fa rollback della copia se il sink fallisce.

## Esempio d’uso

```c
const struct spaghetti_ina219_config ina219_config = {
	.i2c_address = 0x40U,
	.shunt_milliohm = 100U,
	.current_lsb_microamp = 200U,
};
struct spaghetti_discovery_result result = {
	.port_id = 0U,
	.type_id = "ina219",
	.config_size = sizeof(ina219_config),
	.source = SPAGHETTI_DISCOVERY_SOURCE_CONFIG,
	.generation = generation,
};
memcpy(result.config, &ina219_config, sizeof(ina219_config));
int err = spaghetti_discovery_submit_manual(&result);
```

`ina219_config` è una sorgente locale; `memcpy` rende Discovery proprietario dei byte
prima della chiamata. Il sink inoltra `result.config` e `config_size` al Manager, che li
usa soltanto durante `configure()`. Nessuno conserva un puntatore alla struct locale.

## Checklist di completamento

- [ ] Definire i tipi risultato di Discovery.
- [ ] Definire l’API del provider Discovery.
- [ ] Implementare la validazione di Discovery manuale.
- [ ] Inviare i risultati accettati al Module Manager.
- [ ] Instradare le assegnazioni Config tramite Discovery.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Prova risultato valido, Port/type/config invalidi, generazione obsoleta e sink che fallisce. Manager deve cambiare solo per il risultato accettato; nessun provider entra nel Manager.

**Risultato atteso**

Solo risultati validi e non obsoleti raggiungono Manager; Discovery non possiede istanze.

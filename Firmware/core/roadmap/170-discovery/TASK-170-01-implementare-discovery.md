# TASK-170-01 — Implementare Discovery

**Stato:** ⬜ TODO
**Fase:** 170 — Discovery

## Cosa devo fare

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

## Perché è fatto così

Discovery propone assegnazioni normalizzate, ma soltanto Manager crea e possiede le istanze Module.

## Come si usa

Config crea un risultato MANUAL; Discovery lo valida e invoca il sink, che inoltra la richiesta al Module Manager.

## Checklist di completamento

- [ ] Definire i tipi risultato di Discovery.
- [ ] Definire l’API del provider Discovery.
- [ ] Implementare la validazione di Discovery manuale.
- [ ] Inviare i risultati accettati al Module Manager.
- [ ] Instradare le assegnazioni Config tramite Discovery.

## Verifica e fine task

Prova risultato valido, Port/type/config invalidi, generazione obsoleta e sink che fallisce. Manager deve cambiare solo per il risultato accettato; nessun provider entra nel Manager.

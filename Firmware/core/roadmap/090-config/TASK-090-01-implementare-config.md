# TASK-090-01 — Implementare Config

**Stato:** ⬜ TODO
**Fase:** 090 — Config interna

## Cosa devo fare

### Passo 1 — Definire il modello interno di Config

`include/spaghetti/config.h`.

Definire limiti di capacità fissi più `spaghetti_module_config`,
`spaghetti_runtime_sampling_config`, `spaghetti_config` e `spaghetti_config` con solo
versione, assegnazioni di moduli limitate, indirizzo I2C verificato, e un periodo di
campionamento. Dichiarare convalidare e applicare API.

### Passo 2 — Rendere esplicita la proprietà delle stringhe Config

`include/spaghetti/config.h`.

Sostituire qualsiasi `const char *type_id` preso in prestito che deve sopravvivere
decode/input con un array di caratteri di proprietà limitata e un nome massimo.

### Passo 3 — Implementare la validazione di Config

`subsys/config/config.c`.

Implementa la convalida pura per la versione, il conteggio dei moduli, gli ID Port, gli
ID di tipo terminati non vuoti, l'intervallo di indirizzi I2C, le assegnazioni duplicate
Port e il periodo di campionamento non limitato a zero. Non mutare lo stato live
Manager.

### Passo 4 — Implementare l’applicazione di Config

`subsys/config/config.c`.

Convalidare l'intera istantanea prima, quindi chiamare Manager configurare per ogni
modulo iniziale in ordine. Preservare e segnalare il primo guasto index/code. Conservare
i campi di campionamento come accettato ma inattivo fino a quando Runtime esiste.

### Passo 5 — Aggiungere e applicare una Config C statica

`CMakeLists.txt` e `subsys/core/core.c` o `src/main.c`.

Aggiungi `subsys/config/config.c` a CMake. Costruisci uno `spaghetti_config` per Port 0,
`sht40`, l'indirizzo verificato e 1000 ms; chiama `spaghetti_config_apply()` invece di
configurare Manager diretto.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> L'istantanea hardcoded C è intenzionalmente temporanea e verrà rimossa in
  [TASK-150-05](../150-cbor/TASK-150-01-decodificare-config-con-cbor.md).

### Passo 6 — Provare validazione e applicazione di Config

`subsys/config/config.c`, l'infrastruttura di test di prova corrente e la console seriale.

Provare l'istantanea valida più la versione difettosa, il conteggio eccessivo, il
duplicato Port, il tipo sconosciuto, l'indirizzo non valido e il periodo zero.
Confermare le istantanee non valide non fanno un'assegnazione parziale dal vivo e quella
valida conserva SHT40 reale legge.

### Contratti completi da scrivere

```c
#define SPAGHETTI_CONFIG_VERSION 1U
#define SPAGHETTI_CONFIG_MAX_MODULES 1U
#define SPAGHETTI_CONFIG_TYPE_ID_SIZE 16U
struct spaghetti_module_config {
	spaghetti_port_id_t port_id;
	char type_id[SPAGHETTI_CONFIG_TYPE_ID_SIZE];
	struct spaghetti_sht40_config driver_config;
};
struct spaghetti_runtime_sampling_config { uint32_t period_ms; bool enabled; };
struct spaghetti_config {
	uint32_t version;
	size_t module_count;
	struct spaghetti_module_config modules[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_runtime_sampling_config sampling;
};
int spaghetti_config_validate(const struct spaghetti_config *candidate);
int spaghetti_config_apply(const struct spaghetti_config *candidate);
```

Tutte le struct sono pubbliche e copiabili; Config possiede la copia corrente con
lifetime fino al prossimo apply. L’array `type_id` evita puntatori a stringhe scadute.
`candidate` è un prestito `const` valido durante la chiamata. `validate()` è pura e
restituisce `0`, `-EINVAL` o `-ENOTSUP`. `apply()` prima valida, poi configura Manager e
Runtime; conserva la nuova copia solo dopo successo completo e ripristina lo stato
precedente se un componente fallisce. Il chiamante è Core al boot e Communication in
seguito. La configurazione iniziale contiene Port 0, `sht40`, indirizzo verificato,
periodo 1000 ms ed enabled=true.

## Perché è fatto così

Config valida un intero snapshot prima di modificare i componenti e conserva copie proprie dei dati ricevuti.

## Come si usa

Boot, Communication e Storage forniscono snapshot completi. Config valida, applica a Manager/Runtime e conserva una copia soltanto dopo il successo.

## Checklist di completamento

- [ ] Definire il modello interno di Config.
- [ ] Rendere esplicita la proprietà delle stringhe Config.
- [ ] Implementare la validazione di Config.
- [ ] Implementare l’applicazione di Config.
- [ ] Aggiungere e applicare una Config C statica.
- [ ] Provare validazione e applicazione di Config.

## Verifica e fine task

Prova versione, count, stringa, Port duplicato e periodo invalidi senza modifiche live. Inietta un errore Manager/Runtime e verifica rollback; poi applica Port 0/SHT40/1000 ms.

# TASK-030-01 — Implementare Port 0

**Stato:** ⬜ TODO
**Fase:** 030 — Port

## Cosa devo fare

### Passo 1 — Definire l’identificatore di Port

`include/spaghetti/port.h`.

Aggiungi una protezione di inclusione e lo standard minimo include, quindi definisci
`typedef uint8_t spaghetti_port_id_t;`. Non esporre un tipo ESP32 o un numero GPIO.

### Passo 2 — Definire le capacità di Port

`include/spaghetti/port.h`.

Definire `enum spaghetti_port_capability` con solo `SPAGHETTI_PORT_CAP_I2C = BIT(0)`.
Aggiungere solo l'inclusione richiesta per `BIT()`.

### Passo 3 — Dichiarare l’API pubblica di Port

`include/spaghetti/port.h`.

Dichiara in anticipo `struct spaghetti_port` e `struct device`. Dichiara
`spaghetti_port_init_all()`, `spaghetti_port_count()`, `spaghetti_port_get()`,
`spaghetti_port_has_capability()` e `spaghetti_port_i2c_device()` con le firme riportate nella sezione “Contratti completi da scrivere”.

### Passo 4 — Implementare il descrittore privato di Port

`subsys/port/port.c`.

Definire campi privati `struct spaghetti_port` `id`, `capabilities` e `const struct
device *i2c`. Creare un descrittore Port 0 fisso e implementare i controlli di
conteggio, ricerca e capacità con controllo dei puntatori nulli e limiti.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> Questo è intenzionalmente temporaneo e verrà rimosso in
  [TASK-180-05](../180-multi-core/TASK-180-01-supportare-piu-varianti-core.md).

### Passo 5 — Associare Port 0 al device I2C

`subsys/port/port.c`.

In `spaghetti_port_init_all()`, ottenere il controller verificato con
`DEVICE_DT_GET(DT_NODELABEL(...))`, memorizzarlo in Port 0, e restituire `-ENODEV`
quando `device_is_ready()` è falso. Implementa `spaghetti_port_i2c_device()` con
controlli null e funzionalità.

### Passo 6 — Aggiungere Port alla build CMake

`CMakeLists.txt`.

Aggiungere `subsys/port/port.c` all'elenco `target_sources(app PRIVATE ...)` esistente.
Non apportare altre modifiche al sistema di compilazione.

### Passo 7 — Inizializzare Port da Core

`subsys/core/core.c`.

Chiama `spaghetti_port_init_all()` da `spaghetti_core_init()`. Propaga un risultato
negativo prima di impostare Core READY. Al successo, registra il conteggio Port e se
Port 0 ha I2C.

### Passo 8 — Provare Port con ID validi e non validi

`subsys/port/port.c`, `subsys/core/core.c` e la console seriale.

Esegui una prova su Port 0 e un ID fuori intervallo attraverso l'API pubblica. Verificare Port 0 è
pronto e l'ID non valido restituisce `NULL` senza dereferenziarlo. Provare
temporaneamente il percorso di guasto del controller disabilitato senza effettuare il
test overlay cambiamento.

### Contratti completi da scrivere

In `include/spaghetti/port.h` usa le firme letterali seguenti:

```c
typedef uint8_t spaghetti_port_id_t;
enum spaghetti_port_capability { SPAGHETTI_PORT_CAP_I2C = BIT(0) };
struct spaghetti_port;
struct device;
int spaghetti_port_init_all(void);
size_t spaghetti_port_count(void);
const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t port_id);
bool spaghetti_port_has_capability(const struct spaghetti_port *port,
				    enum spaghetti_port_capability capability);
const struct device *spaghetti_port_i2c_device(const struct spaghetti_port *port);
```

`port_id` e `capability` sono piccoli valori copiati. `port` è un prestito in sola
lettura: Port possiede l’oggetto fino allo spegnimento. Il device restituito appartiene
al Device Model e ha la stessa lifetime statica. `get()` restituisce `NULL` per ID fuori
intervallo; `has_capability()` restituisce `false` per `NULL`; `i2c_device()` restituisce
`NULL` per `NULL` o capacità assente. `init_all()` restituisce `0` oppure `-ENODEV`.

In `port.c` la struct privata è
`{ spaghetti_port_id_t id; uint32_t capabilities; const struct device *i2c; }`:
catalogo e campi sono posseduti da Port e vivono per tutto il firmware. `init_all()`
risolve `DT_NODELABEL(i2c0)`, controlla readiness e solo dopo rende valido il catalogo.

## Perché è fatto così

Port nasconde i dettagli della board e presta descrittori immutabili ai driver senza allocazione dinamica.

## Come si usa

Core inizializza il catalogo. Driver e Manager ottengono un `const struct spaghetti_port *`, interrogano le capacità e prendono in prestito il device I2C.

## Concetto Zephyr da sapere

### Associare Port 0 al device I2C

1. **Cos’è:** Il Device Model rappresenta periferiche inizializzate da Zephyr tramite `struct device`. `DEVICE_DT_GET()` converte un nodo Devicetree noto a build-time nel puntatore al relativo device.
2. **A cosa serve:** Consente a Port 0 di conservare il controller I2C senza creare manualmente un driver o una struttura hardware.
3. **Quando viene usato:** La macro risolve il riferimento durante la build; `device_is_ready()` controlla a runtime che inizializzazione e dipendenze siano riuscite.
4. **Build-time o runtime:** Riferimento a build-time, verifica e utilizzo a runtime.
5. **Collegamento con questo task:** Il descrittore privato di Port 0 deve puntare al controller I2C abilitato nella fase 020.
6. **File reali coinvolti:** `subsys/port/port.c`; per verifica anche `build/zephyr/zephyr.dts` e l’header Devicetree generato.
7. **Cosa guardare nei file:** Individua la node label I2C reale, la chiamata `DEVICE_DT_GET()` e il controllo `device_is_ready()`.
8. **Cosa non modificare:** Non istanziare `struct device`, non chiamare direttamente l’init del driver e non usare una label inventata.

## Checklist di completamento

- [ ] Definire l’identificatore di Port.
- [ ] Definire le capacità di Port.
- [ ] Dichiarare l’API pubblica di Port.
- [ ] Implementare il descrittore privato di Port.
- [ ] Associare Port 0 al device I2C.
- [ ] Aggiungere Port alla build CMake.
- [ ] Inizializzare Port da Core.
- [ ] Provare Port con ID validi e non validi.

## Verifica e fine task

Esegui validator e build. Prova count=1, Port 0 valido, ID 1 nullo, capacità I2C vera e device pronto; prova anche il percorso `-ENODEV`. Fine dopo flash stabile.

# TASK-110-01 — Distribuire i campioni con zbus

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus

## Cosa devo fare

### Passo 1 — Definire il messaggio del campione di temperatura

`include/spaghetti/data.h`.

Definisci campi `spaghetti_temperature_sample` immutabili per l'ID del modulo sorgente,
la temperatura a punto fisso o microunità, l'umidità se mantenuta, il timestamp, il
numero di sequenza e i flag che indicano quali dati sono validi. Dichiara le API per
inizializzare Data e pubblicare le
API.

### Passo 2 — Abilitare i subscriber di zbus

`prj.conf`.

Abilita `CONFIG_ZBUS=y` e `CONFIG_ZBUS_MSG_SUBSCRIBER=y`. Seleziona solo le impostazioni
del buffer di messaggi static/fixed richieste dall'aiuto Kconfig installato; non
abilitare l'allocazione dinamica per impostazione predefinita.

### Passo 3 — Definire il canale temperatura e i subscriber

`subsys/data/data.c`.

Definire `spaghetti_temperature_chan` con `ZBUS_CHAN_DEFINE` e due osservatori
`ZBUS_MSG_SUBSCRIBER_DEFINE`: uno per il logging e uno per il test. Usa il tipo di
campione esatto, un piccolo validatore e un valore iniziale limitato.

### Passo 4 — Inizializzare Data e pubblicare un messaggio

`subsys/data/data.c` e `CMakeLists.txt`.

Implementa `spaghetti_data_init()` e `spaghetti_data_publish_temperature()` utilizzando
`zbus_chan_pub()` con il timeout fornito dal chiamante. Aggiungi `data.c` a CMake e
propaga gli errori validation/publish.

### Passo 5 — Pubblicare i campioni reali del Manager

Il sito di acquisizione del gestore e `subsys/data/data.c`.

Dopo aver letto con successo Manager, costruisci `spaghetti_temperature_sample`,
aggiungi timestamp e sequenza e chiama l'API Data publish. Rimuovi il sensore
diretto-driver; il logger subscriber diventa il proprietario del display.

### Passo 6 — Provare fan-out e backpressure di zbus

Imbragatura `subsys/data/data.c`, subscriber loops/test e console seriale.

Ricevere la stessa sequenza in logger e iscritti ai test. Riempire o bloccare un
percorso subscriber limitato deliberatamente e verificare la politica timeout/error
selezionata senza bloccare per sempre.

### Contratti completi da scrivere

```c
struct spaghetti_temperature_message {
	spaghetti_module_id_t source_id;
	int32_t temperature_millicelsius;
	int64_t timestamp_ms;
	uint32_t sequence;
};
int spaghetti_data_init(void);
int spaghetti_data_publish_temperature(
	const struct spaghetti_temperature_message *message, k_timeout_t timeout);
```

Il messaggio è pubblico, senza puntatori e copiabile: publisher lo possiede fino al
ritorno, poi zbus possiede le copie. `source_id` identifica il Module; temperatura è in
millesimi di °C; timestamp è uptime in ms; sequence cresce con wrap documentato.
`message` è `const` perché Data non modifica l’input. `timeout` è passato per valore e
limita l’attesa. Publish restituisce `0`, `-EINVAL` o gli errori di
`zbus_chan_pub()`.

Definisci un canale statico e due `ZBUS_MSG_SUBSCRIBER_DEFINE` con code di capacità
esplicita: logger e consumer di prova. `data_init()` azzera sequenza/diagnostica e
restituisce `0` o `-EINVAL` per configurazione statica incoerente. Runtime/il test crea
il messaggio sullo stack e pubblica; nessun consumer conserva il puntatore ricevuto.

## Perché è fatto così

zbus disaccoppia il produttore dai consumer copiando messaggi piccoli in risorse con capacità definita.

## Come si usa

Runtime pubblica un messaggio copiato. Logger e secondo consumer ricevono copie indipendenti dalle proprie code.

## Concetto Zephyr da sapere

### Abilitare i subscriber di zbus

1. **Cos’è:** zbus è il bus di messaggi interno di Zephyr. Un channel definisce tipo del messaggio e osservatori; un message subscriber riceve una copia tramite una coda limitata.
2. **A cosa serve:** Disaccoppia chi pubblica un campione dai consumer che lo elaborano a velocità diverse.
3. **Quando viene usato:** Canali e subscriber sono dichiarati staticamente; pubblicazione e ricezione avvengono a runtime.
4. **Build-time o runtime:** Strutture create a build-time, scambio dati a runtime.
5. **Collegamento con questo task:** Data dovrà consegnare lo stesso campione al logger e a un secondo consumer senza condividere puntatori temporanei.
6. **File reali coinvolti:** `prj.conf` in questo task; dichiarazioni di canale e subscriber arriveranno in `subsys/data/data.c` nel task successivo.
7. **Cosa guardare nei file:** Controlla `CONFIG_ZBUS`, supporto message subscriber e capacità delle code nell’help Kconfig installato.
8. **Cosa non modificare:** Non usare allocazione dinamica, non usare zbus automaticamente per lifecycle/comandi e non creare ancora consumer MQTT.

### Inizializzare Data e pubblicare un messaggio

Il canale copia un messaggio limitato. Non pubblicare un puntatore di stack preso in
prestito per il consumo asincrono.

## Checklist di completamento

- [ ] Definire il messaggio del campione di temperatura.
- [ ] Abilitare i subscriber di zbus.
- [ ] Definire il canale temperatura e i subscriber.
- [ ] Inizializzare Data e pubblicare un messaggio.
- [ ] Pubblicare i campioni reali del Manager.
- [ ] Provare fan-out e backpressure di zbus.

## Verifica e fine task

Pubblica un campione noto e verifica copie identiche nei due consumer. Satura una coda con `K_NO_WAIT` e controlla errno/counter; poi pubblica campioni reali.

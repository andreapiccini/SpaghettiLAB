# TASK-040-01 — Leggere il sensore SHT40

**Stato:** ⬜ TODO
**Fase:** 040 — Sezione verticale SHT40

## Prima di scrivere: concetti Zephyr

### Esaminare il driver SHT4x fornito da Zephyr

L'API del sensore Zephyr richiede un dispositivo staticamente istanziato Devicetree. Ciò
è accettabile per il lancio ma non per il modello finale del modulo rimovibile.

### Aggiungere il nodo Devicetree temporaneo di SHT40

1. **Cos’è:** Un binding YAML descrive quali proprietà sono valide per una famiglia di nodi Devicetree. La proprietà `compatible` seleziona il binding e permette a Zephyr di creare l’istanza del driver corretto.
2. **A cosa serve:** Collega temporaneamente l’indirizzo I2C reale al driver SHT4x già fornito da Zephyr.
3. **Quando viene usato:** Binding e nodo vengono validati ed elaborati durante la build; il driver risultante viene inizializzato al boot.
4. **Build-time o runtime:** Definizione a build-time, device utilizzato a runtime.
5. **Collegamento con questo task:** Serve a provare verticalmente il sensore prima di rimuovere questa associazione statica nella fase 080.
6. **File reali coinvolti:** `boards/esp32c3_devkitm_esp32c3.overlay`; consulta il binding SHT4x trovato nel task precedente dentro il workspace Zephyr.
7. **Cosa guardare nei file:** Nel binding controlla valore `compatible`, proprietà richieste e significato di `reg`; nell’overlay aggiungi il nodo figlio al bus I2C.
8. **Cosa non modificare:** Non creare un binding Spaghetti LAB, non copiare proprietà non previste e non trasformare questa assegnazione temporanea in architettura definitiva.

### Abilitare l’API Sensor di Zephyr

Kconfig seleziona il codice Sensor API e driver al momento della compilazione. La scheda
overlay seleziona l'istanza del dispositivo SHT4x in cemento.

### Implementare il wrapper temporaneo SHT40

L'API del sensore normalizza i canali del sensore tramite `struct sensor_value`.
Mantenere questo sincrono wrapper e non aggiungere thread.

## Perché lo facciamo

La prova verticale separa subito problemi elettrici, I2C e driver prima di introdurre le astrazioni Module.

## Implementazione guidata

### Passo 1 — Esaminare il driver SHT4x fornito da Zephyr

File Zephyr installati all'interno di `make shell`: `drivers/sensor/sensirion/sht4x/`,
`dts/bindings/sensor/sensirion,sht4x.yaml` e `samples/sensor/sht4x/`.

Ispezionare le driver installate, binding e il campione. Confermare la stringa
compatibile, richiesta `repeatability`, i nomi dei canali e le aspettative di indirizzo.
Registrare la decisione di utilizzare la Zephyr statico driver solo per portare-up; non
cambiare i file di produzione.

### Passo 2 — Aggiungere il nodo Devicetree temporaneo di SHT40

`boards/esp32c3_devkitm_esp32c3.overlay`.

Sotto il controller I2C reale già abilitato aggiungere:

```dts
/* TEMPORARY SHORTCUT: removed in Milestone 8. */
sht40_test: sht4x@44 {
    compatible = "sensirion,sht4x";
    reg = <0x44>;
    repeatability = <2>;
};
```

Utilizzare `0x44` solo dopo aver verificato l'effettiva selezione module/address. Il
nodo statico serve soltanto per il bring-up iniziale: non rappresenta il modello finale
del modulo rimovibile.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> Questo è intenzionalmente temporaneo e verrà rimosso in
  [TASK-080-05](../080-runtime-removable-sht40/TASK-080-01-rendere-sht40-configurabile-a-runtime.md).

### Passo 3 — Abilitare l’API Sensor di Zephyr

`prj.conf`.

Aggiungi `CONFIG_SENSOR=y`. Dopo la configurazione, confermare `CONFIG_SHT4X=y` viene
selezionato automaticamente dal nodo compatibile abilitato; non forzare i driver dei
sensori non collegati.

### Passo 4 — Dichiarare l’API del wrapper temporaneo SHT40

Crea `spaghetti_modules/sht40/sht40.h`.

Aggiungi una protezione include e dichiara `spaghetti_sht40_test_init()` più
`spaghetti_sht40_test_read(struct sensor_value *temperature, struct sensor_value
*humidity)`. Includi o dichiara in avanti solo ciò che queste firme richiedono.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> Questa API è intenzionalmente temporanea e verrà rimossa in
  [TASK-080-05](../080-runtime-removable-sht40/TASK-080-01-rendere-sht40-configurabile-a-runtime.md).

### Passo 5 — Implementare il wrapper temporaneo SHT40

Crea `spaghetti_modules/sht40/sht40.c`.

Ottenere `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`; implementare init con
`device_is_ready()`. Implementare leggere con `sensor_sample_fetch()` seguito da
`sensor_channel_get()` per la temperatura ambiente e l'umidità. Convalidare sia i
puntatori di uscita e propagare ogni errore Zephyr.

### Passo 6 — Aggiungere il wrapper SHT40 a CMake

`CMakeLists.txt`.

Aggiungi `spaghetti_modules/sht40/sht40.c` a `target_sources(app PRIVATE ...)` senza
cambiare altre fonti.

### Passo 7 — Chiamare il wrapper SHT40 da main

`src/main.c`.

Dopo l'inizializzazione Core, chiamare `spaghetti_sht40_test_init()` una volta. Nel loop
esistente, chiamare la lettura temporanea una volta al secondo e stampare entrambi i
valori `sensor_value` utilizzando `val1` interi e `val2` assoluto a sei cifre; gestire
gli errori di lettura senza dipendere dalla formattazione `%f` di `printf`.

### Passo 8 — Compilare e ispezionare l’immagine SHT40

`build/zephyr/.config`, `build/zephyr/zephyr.dts` e `build/zephyr/zephyr.bin`.

Eseguire una build incontaminata. Confermare `CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, il
nodo `sht40_test` è abilitato all'indirizzo verificato e il binario del firmware esiste.
Non modificare i file generati.

### Passo 9 — Caricare e provare il sensore SHT40 reale

L'hardware collegato SHT40, root `README.md` e la console seriale.

Esegui il flash dell'immagine corrente e osserva valori plausibili di temperatura e
umidità una volta al
secondo, quindi scollegare il sensore e verificare il percorso di lettura segnala un
errore controllato. Ripristinare l'hardware dopo il test.

### Contratti completi da scrivere

```c
struct sensor_value;
int spaghetti_sht40_test_init(void);
int spaghetti_sht40_test_read(struct sensor_value *temperature,
			      struct sensor_value *humidity);
```

`init()` usa l’unica istanza Devicetree temporanea, non modifica dati del chiamante e
restituisce `0` o `-ENODEV`. `temperature` e `humidity` sono destinazioni obbligatorie,
possedute dal chiamante e valide per tutta la chiamata; sono puntatori non `const`
perché la funzione scrive i risultati. `read()` restituisce `-EINVAL` per `NULL` e
propaga gli errori Sensor. Usa variabili temporanee e copia entrambi gli output solo
dopo fetch e lettura di entrambi i canali riusciti.

Implementa le due funzioni così:

1. `spaghetti_sht40_test_init()` è chiamata da `main()` dopo Core. Non modifica dati
   del chiamante: controlla `device_is_ready(sht40_device)` e restituisce `0` oppure
   `-ENODEV`.
2. `spaghetti_sht40_test_read(temperature, humidity)` è chiamata una volta per ciclo.
   Controlla entrambi i puntatori, esegue `sensor_sample_fetch()`, legge temperatura e
   umidità in due variabili locali, poi copia le variabili negli output. I puntatori
   sono usati perché servono due risultati; non sono `const` perché vengono scritti e
   non vengono conservati dopo il ritorno. Restituisce `-EINVAL` per `NULL` e propaga
   invariato ogni errno delle API Sensor.

## Esempio d’uso

```c
struct sensor_value temperature;
struct sensor_value humidity;
int err = spaghetti_sht40_test_read(&temperature, &humidity);
```

## Checklist di completamento

- [ ] Esaminare il driver SHT4x fornito da Zephyr.
- [ ] Aggiungere il nodo Devicetree temporaneo di SHT40.
- [ ] Abilitare l’API Sensor di Zephyr.
- [ ] Dichiarare l’API del wrapper temporaneo SHT40.
- [ ] Implementare il wrapper temporaneo SHT40.
- [ ] Aggiungere il wrapper SHT40 a CMake.
- [ ] Chiamare il wrapper SHT40 da main.
- [ ] Compilare e ispezionare l’immagine SHT40.
- [ ] Caricare e provare il sensore SHT40 reale.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Esegui validator e build pristine; controlla nodo e Kconfig generati. Flasha e registra almeno dieci letture plausibili senza reset o errori I2C.

**Risultato atteso**

Il device SHT40 è ready e dieci letture reali producono temperatura e umidità plausibili.

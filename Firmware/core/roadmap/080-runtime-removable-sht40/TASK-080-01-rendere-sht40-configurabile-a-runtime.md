# TASK-080-01 — Rendere SHT40 configurabile a runtime

**Stato:** ⬜ TODO
**Fase:** 080 — SHT40 rimovibile a runtime

## Cosa devo fare

### Passo 1 — Definire la configurazione runtime di SHT40

`spaghetti_modules/sht40/sht40.h`.

Definire `struct spaghetti_sht40_config` con solo l'indirizzo I2C verificato.
Documentare la proprietà e l'intervallo di indirizzi valido; non includere un puntatore
del sensore Zephyr.

### Passo 2 — Passare al Manager una configurazione driver limitata

`include/spaghetti/module_driver.h`, `include/spaghetti/module_manager.h` e
`subsys/module_manager/module_manager.c`.

Estendere il contratto driver initialization/configure con un puntatore di
configurazione limitato e lunghezza, o una configurazione iniziale di tipo altrettanto
piccolo. Convalidare pointer/length prima di driver init e garantire che l'istanza
possiede tutti i dati che devono sopravvivere alla chiamata.

### Passo 3 — Implementare la misura SHT40 direttamente su I2C

`spaghetti_modules/sht40/sht40.c` e l'esatta scheda tecnica SHT40.

Sostituire il sensore API fetch/get all'interno di driver init/read con
`spaghetti_port_i2c_device()` e la transazione `i2c_write`, `i2c_read` o
`i2c_write_read` per la modalità di misura scelta. Mantenere costanti di protocollo
tracciabili alle sezioni del foglio dati.

### Passo 4 — Convalidare il CRC e convertire i campioni SHT40

`spaghetti_modules/sht40/sht40.c`.

Implementa il controllo CRC descritto nel datasheet per entrambi i valori grezzi.
Converti temperatura e umidità nella rappresentazione già usata dal progetto, limita i
valori soltanto quando il datasheet lo richiede e restituisci un errore se il CRC non
corrisponde.

### Passo 5 — Rimuovere la scorciatoia Sensor statica

`boards/esp32c3_devkitm_esp32c3.overlay`, `prj.conf`, `spaghetti_modules/sht40/sht40.h`
e `spaghetti_modules/sht40/sht40.c`.

Eliminare il nodo `sht40_test` Devicetree, il test temporaneo API,
`DT_NODELABEL(sht40_test)` e tutte le chiamate `sensor_*`. Rimuovere `CONFIG_SENSOR=y`
se nessun altro consumatore ne ha bisogno; mantenere `CONFIG_I2C=y` e il percorso di
indirizzo runtime.

### Passo 6 — Eseguire il test di regressione di SHT40 runtime

`build/zephyr/.config`, `build/zephyr/zephyr.dts` e la console seriale.

Confermare l'uscita generata non ha alcuna istanza SHT4x o dipendenza da Sensor API.
Indirizzo Flash e test valido, indirizzo non valido, sensore mancante, guasto CRC dove
iniettabile, e un ciclo remove/reconfigure.

### Contratti completi da scrivere

```c
struct spaghetti_sht40_config { uint8_t i2c_address; };
int spaghetti_module_manager_configure(spaghetti_port_id_t port_id,
				       const char *type_id,
				       const void *driver_config,
				       size_t driver_config_size,
				       spaghetti_module_id_t *out_id);
```

`i2c_address` è un indirizzo I2C 7-bit copiato; accetta soltanto gli indirizzi SHT40
ammessi dal componente verificato. `driver_config` è un buffer `const` preso in prestito
per la chiamata; Manager ne controlla la dimensione e il driver ne copia il contenuto
nel context privato prima del ritorno. Nessun puntatore del chiamante viene conservato.

Nel driver, init risolve il device tramite il Port. Read invia il comando di misura,
attende il tempo massimo da datasheet nel thread chiamante, legge esattamente 6 byte,
verifica separatamente i due CRC-8 e solo allora converte temperatura e umidità nelle
unità di `spaghetti_sample`. Propaga errori I2C e restituisce `-EBADMSG` per CRC errato.
Rimuovi nodo SHT40, `CONFIG_SENSOR`, wrapper temporaneo e ogni chiamata Sensor.

## Perché è fatto così

Il tipo di sensore è una scelta runtime; nel Devicetree resta soltanto il controller fisicamente saldato.

## Come si usa

Config passa al Manager una copia limitata di `spaghetti_sht40_config`; il driver usa il device I2C del Port e non un nodo sensore statico.

## Concetto Zephyr da sapere

### Implementare la misura SHT40 direttamente su I2C

Le chiamate Zephyr I2C possono bloccare e appartenere al contesto thread. Lo driver deve
utilizzare il controller di proprietà Port piuttosto che istigare un sensore rimovibile
in Devicetree.

### Rimuovere la scorciatoia Sensor statica

La rimozione del nodo dimostra identità rimovibile è stato runtime. La scheda Devicetree
deve continuare a descrivere solo il controller fisico I2C e il cablaggio Port.

## Checklist di completamento

- [ ] Definire la configurazione runtime di SHT40.
- [ ] Passare al Manager una configurazione driver limitata.
- [ ] Implementare la misura SHT40 direttamente su I2C.
- [ ] Convalidare il CRC e convertire i campioni SHT40.
- [ ] Rimuovere la scorciatoia Sensor statica.
- [ ] Eseguire il test di regressione di SHT40 runtime.

## Verifica e fine task

Esegui ricerca globale: nessun nodo SHT40, API Sensor o wrapper temporaneo deve restare. Prova indirizzo/size invalidi, errore I2C e CRC; poi dieci letture hardware valide.

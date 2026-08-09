# TASK-020-01 — Verificare e abilitare I2C

**Stato:** ⬜ TODO
**Fase:** 020 — Scheda attuale / I2C

## Cosa devo fare

### Passo 1 — Verificare controller e pin I2C reali

Lo schema Core, lo schema del connettore del modulo e l'attuale pinout della scheda
ESP32-C3.

Annota il controller esatto, i pin SDA e SCL, le resistenze di pull-up, la linea di
alimentazione e la revisione della scheda che raggiungono fisicamente le Spaghetti Port.
Non modificare i
file di produzione.

### Passo 2 — Ispezionare il Devicetree generato

`build/zephyr/zephyr.dts` e le definizioni di ESP32-C3 DTS/pinctrl installate
all'interno di `make shell`.

Individuare l'etichetta del controller I2C verificata, il suo stato attuale e la
sintassi ESP32-C3 pinctrl installata. Registrare le etichette esatte dei nodi necessarie
per overlay; non modificare i file generati.

### Passo 3 — Abilitare I2C nell’overlay della scheda

`boards/esp32c3_devkitm_esp32c3.overlay`.

Aggiungi o ridefinisci il vero controller I2C e il suo vero pinctrl. Solo modello concettuale:

```dts
/* I2C_CONTROLLER and I2C_PINCTRL are placeholders resolved in Step 2.1. */
&I2C_CONTROLLER {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;
    pinctrl-0 = <&I2C_PINCTRL>;
    pinctrl-names = "default";
};
```

Definire il corrispondente gruppo ESP32 pinctrl utilizzando la sintassi già utilizzata
dall'ESP32-C3 DTS/bindings installato; non copiare numeri dei pin da un'altra scheda.

### Passo 4 — Abilitare il supporto I2C di Zephyr

`prj.conf`.

Aggiungi `CONFIG_I2C=y`. Questo compila in modo permanente le API generiche del
controller I2C richieste dalle porte I2C.

### Passo 5 — Controllare la configurazione I2C generata

`build/zephyr/zephyr.dts` e `build/zephyr/.config`.

Dopo una build pulita, confermare che il controller selezionato è `okay`,
i pin generati corrispondono allo schema verificato, e `.config` contiene
`CONFIG_I2C=y`. Non modificare né il file generato.

### Passo 6 — Caricare e provare la baseline I2C

`README.md` e la console seriale.

Non aggiungere codice. Lanciare l'immagine generata dalla build pulita e verificare che il controller
non utilizzato non abbia rotto l'avvio o la console USB.

## Perché è fatto così

Controller e pin sono fatti hardware statici; descriverli nel Devicetree evita numeri GPIO nel codice C.

## Come si usa

La build genera `zephyr.dts`; la fase Port userà `DEVICE_DT_GET(DT_NODELABEL(i2c0))` e `device_is_ready()` a runtime.

## Concetto Zephyr da sapere

### Ispezionare il Devicetree generato

1. **Cos’è:** Il Devicetree è la descrizione gerarchica dell’hardware nota a Zephyr. I file `.dts` descrivono una board completa; i `.dtsi` sono frammenti inclusi e riutilizzati.
2. **A cosa serve:** Permette alla build di sapere quali periferiche esistono, indirizzi, pin, stato e collegamenti senza codificarli negli algoritmi C.
3. **Quando viene usato:** La board selezionata, i `.dtsi` del SoC e gli overlay dell’applicazione vengono uniti durante la build.
4. **Build-time o runtime:** Build-time; il risultato genera macro e oggetti device usati poi a runtime.
5. **Collegamento con questo task:** Prima di cambiare I2C devi vedere quale controller e quali label esistono davvero nella board ESP32-C3 selezionata.
6. **File reali coinvolti:** `build/zephyr/zephyr.dts` è il risultato finale; i sorgenti originali sono indicati nei commenti del file e nella directory board di Zephyr.
7. **Cosa guardare nei file:** Cerca `i2c`, `status`, le node label come `i2c0` e i riferimenti `pinctrl-*`.
8. **Cosa non modificare:** Non modificare `build/zephyr/zephyr.dts`, i `.dts` o `.dtsi` installati da Zephyr; in questo task devi soltanto ispezionarli.

### Abilitare I2C nell’overlay della scheda

1. **Cos’è:** Un overlay è un file che modifica il Devicetree della board selezionata senza cambiare i sorgenti Zephyr. Una node label, per esempio `i2c0`, permette di riferirsi a un nodo già definito. `pinctrl` descrive su quali GPIO viene instradata la periferica.
2. **A cosa serve:** Adatta controller e pin della board generica al cablaggio reale di Spaghetti LAB.
3. **Quando viene usato:** Zephyr unisce l’overlay al DTS della board durante la configurazione della build.
4. **Build-time o runtime:** Build-time.
5. **Collegamento con questo task:** Il controller I2C esiste già nel SoC; qui devi abilitarlo e associargli soltanto i pin verificati nel task precedente.
6. **File reali coinvolti:** `boards/esp32c3_devkitm_esp32c3.overlay`.
7. **Cosa guardare nei file:** Confronta le label e la sintassi `pinctrl` con `build/zephyr/zephyr.dts` e con i file board installati.
8. **Cosa non modificare:** Non inserire ancora il nodo SHT40, un’identità di modulo rimovibile o numeri dei pin copiati da un’altra board.

### Abilitare il supporto I2C di Zephyr

`CONFIG_I2C=y` compila il generico Zephyr I2C API e il controller selezionato driver.
Non descrive pin e non è configurazione runtime.

## Checklist di completamento

- [ ] Verificare controller e pin I2C reali.
- [ ] Ispezionare il Devicetree generato.
- [ ] Abilitare I2C nell’overlay della scheda.
- [ ] Abilitare il supporto I2C di Zephyr.
- [ ] Controllare la configurazione I2C generata.
- [ ] Caricare e provare la baseline I2C.

## Verifica e fine task

Esegui `make pristine`; controlla `i2c0`, pin e `status = "okay"` in `build/zephyr/zephyr.dts` e `CONFIG_I2C=y` in `.config`. Flasha: boot e console devono restare stabili.

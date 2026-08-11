# Contratto hardware astratto per la manutenzione

Questo documento definisce ciò che ogni variante Core deve offrire per supportare
provisioning e aggiornamento senza USB. Il firmware comune non contiene numeri GPIO e
non assume quale controller realizzi il collegamento.

## Confine tra firmware comune e board

Il firmware comune conosce un solo `maintenance link` con queste operazioni logiche:

```c
enum spaghetti_maintenance_entry_reason {
	SPAGHETTI_MAINTENANCE_CONFIG_ABSENT,
	SPAGHETTI_MAINTENANCE_BOOTSTRAP_FRAME,
	SPAGHETTI_MAINTENANCE_REBOOT_REQUEST,
};

int spaghetti_maintenance_link_init(void);
int spaghetti_maintenance_link_probe(uint32_t timeout_ms, bool *requested);
int spaghetti_maintenance_link_enter(
	enum spaghetti_maintenance_entry_reason reason);
int spaghetti_maintenance_link_leave(void);
```

`timeout_ms` è passato per valore perché è un limite numerico piccolo. `requested` è
un puntatore modificabile posseduto dal chiamante: viene scritto solo quando la probe
termina correttamente. `reason` è passato per valore e serve per diagnostica e policy,
non seleziona pin. Queste API vengono chiamate dal Core boot thread e dal coordinatore
Update, mai da ISR.

Il backend di board deve garantire che:

- `probe()` ascolti soltanto, senza trasmettere né iniziare un aggiornamento;
- `enter()` renda disponibile il trasporto locale e impedisca l'uso contemporaneo del
  collegamento normale;
- `leave()` chiuda il trasporto, ripristini pin/controller normali e sia ripetibile;
- ogni errore lasci i pin in uno stato noto e non abiliti due periferiche insieme.

## Descrizione tramite Devicetree

La variante Core descrive un nodo compatibile `spaghettilab,maintenance-link`. Il
binding deve richiedere riferimenti logici, non numeri GPIO nell'API comune:

```dts
maintenance_link0: maintenance-link {
	compatible = "spaghettilab,maintenance-link";
	normal-bus = <&i2c0>;
	maintenance-uart = <&uart_controller_from_this_board>;
	bootstrap-window-ms = <500>;
	status = "okay";
};
```

`normal-bus` è il controller usato dall'Engine. `maintenance-uart` è il device Zephyr
usato dal backend locale. `bootstrap-window-ms` limita l'ascolto quando esiste già una
Config. Pin, pinmux e controller concreti restano nei nodi/pinctrl della board o nel
suo overlay. Il task 260 sostituirà il nome descrittivo dell'esempio con il node label
UART realmente presente nella versione Zephyr e nella board selezionata.

Una variante che non fornisce il nodo non espone la capability. Kconfig/CMake devono
rifiutare l'abilitazione della manutenzione locale su quella build; il firmware comune
non deve creare un fallback con pin hard-coded.

## Mappatura verificata per Core V1

Core V1 riusa i due segnali già documentati:

| Ruolo logico | Modalità normale | Modalità manutenzione |
|---|---|---|
| Data 0 | GPIO3, I2C SDA open-drain | UART RX |
| Data 1 | GPIO4, I2C SCL open-drain | UART TX |
| Riferimento | massa comune | massa comune |

GPIO3 e GPIO4 compaiono soltanto nei file board/pinctrl. Non devono apparire in Update,
Core, Communication, Maintenance Link pubblico o nel tool host. Su un'altra Core la
stessa API può usare altri pin o un altro backend dichiarato dall'overlay.

Durante la finestra di bootstrap con Config valida, il backend mantiene TX inattivo e
ascolta un frame sulla linea RX. Solo un frame completo, versionato, bounded e
autenticato autorizza `enter()`. Un sensore I2C non trasmette spontaneamente quel frame;
assenza di frame o rumore riportano i pin a I2C al termine della finestra.

## Regole di ingresso al boot

L'ordine è deterministico:

1. Core inizializza Storage e Maintenance Link senza avviare Wi-Fi, Runtime o Module.
2. Config assente o non decodificabile: entra direttamente in maintenance locale e vi
   resta in attesa di Config o firmware. Wi-Fi e OTA di rete rimangono spenti.
3. Marker one-shot `maintenance/boot_once` presente: Core lo cancella prima di entrare
   in maintenance. Un reset successivo non crea un loop, salvo Config ancora assente.
4. Config valida senza marker: `probe()` apre la sola finestra RX di bootstrap. Un
   payload valido entra in maintenance; timeout o payload invalido avviano `NORMAL`.
5. In `NORMAL`, una richiesta autenticata può salvare il marker one-shot e riavviare.

Il marker non fa parte della Config utente e non rappresenta uno stato Update. È una
richiesta transitoria separata: viene consumata una volta. Maintenance rende disponibile
il canale locale, ma la scrittura di `image-1` comincia soltanto dopo un comando Image
Management accettato dal coordinatore Update.

Quando una nuova Config viene ricevuta correttamente mentre il dispositivo era senza
Config, il comportamento predefinito è rispondere alla base, chiudere maintenance e
riavviare in `NORMAL`. Un upload incompleto viene invece cancellato prima del riavvio.

## Proprietà di sicurezza

- Nessun valore persistente può forzare `RECEIVING` o confermare una nuova immagine.
- Il probe di boot non trasmette sui pin condivisi prima di un frame valido.
- Config assente abilita solo manutenzione locale, non Wi-Fi o listener OTA di rete.
- Un payload di ingresso non contiene l'immagine: autorizza soltanto la modalità.
- Timeout, frame errato e reset ripristinano firmware precedente e stato deterministico.
- Il firmware attivo resta in `image-0`; un candidato usa soltanto `image-1`.

## Cosa deve verificare ogni nuova Core

- Il controller normale e quello di manutenzione possono essere sospesi e riattivati.
- Gli stati pinctrl non abilitano contemporaneamente due periferiche sugli stessi pin.
- Livelli, pull e tensione sono compatibili con base e Module collegati.
- TX rimane inattivo durante probe e reset.
- La base e il dispositivo condividono un riferimento elettrico.
- Overlay e DTS generato contengono soltanto pin reali della variante.

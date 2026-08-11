# Diario dei problemi, delle soluzioni e delle decisioni

[← README](README.md) · [Architettura](ARCHITECTURE.md) ·
[Contratto connettività e risorse](CONNECTIVITY_AND_RESOURCE_CONTRACT.md) ·
[Promemoria hardware](PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md)

Questo documento conserva gli incidenti tecnici incontrati durante lo sviluppo del
firmware Spaghetti LAB, la causa effettivamente accertata, la soluzione adottata e la
decisione architetturale che ne è derivata. È un registro operativo aggiornato fino
all'11 agosto 2026, non un sostituto dei test o della documentazione dei componenti.

## Come leggere il registro

Ogni voce usa uno di questi stati:

| Stato | Significato |
|---|---|
| **Risolto** | Causa e correzione sono implementate o documentate con una verifica ripetibile. |
| **Atteso** | Il comportamento osservato è corretto e non richiede una correzione. |
| **Mitigato** | Il sistema funziona, ma la causa o la soluzione definitiva richiede altre prove. |
| **Pianificato** | La decisione è congelata, ma non esiste ancora l'implementazione. |
| **Rinviato** | Servono hardware reale o decisioni di produzione non ancora disponibili. |

Non trasformare una voce **Mitigata**, **Pianificata** o **Rinviata** in una promessa di
prodotto. Prima di cambiare una soluzione già adottata, rileggi il campo “Risultato e
regola permanente”: spesso spiega quale regressione la soluzione stava evitando.

## Diagnosi rapida

Quando compare un problema nuovo, usa questo ordine:

1. conserva il primo errore completo, non soltanto l'ultima riga di Ninja;
2. esegui `make validate` per controllare esattamente le sorgenti viste da CMake;
3. se sono cambiati Kconfig, CMake o Devicetree, esegui `make pristine`;
4. per un errore hardware, separa “driver compilato” da “dispositivo realmente
   collegato e pronto”;
5. per rete o TLS, salva stato Wi-Fi, stato del servizio e primo errore handshake;
6. per crash o `-ENOMEM`, misura stack e memoria nel carico reale, non soltanto a boot;
7. per OTA, non cancellare mai l'immagine confermata durante la diagnosi.

Comandi di prima diagnosi:

```sh
make validate
make pristine
make ports
make monitor
make screen
```

Comandi Shell utili sul dispositivo:

```text
spaghetti status
spaghetti wifi list
wifi status
spaghetti remote status
kernel thread stacks
```

## Formattazione e validator

### Indentazione a spazi, whitespace finale e contratti header

**Stato:** Risolto.

**Sintomi osservati:**

```text
ERROR [C001] ... Block indentation uses spaces
ERROR [FMT001] ... Trailing whitespace
ERROR [HDR004] ... Public function parameter is undocumented
ERROR [HDR005] ... Public function return contract is incomplete
```

**Causa:** il firmware segue lo stile C di Zephyr: un livello di blocco usa un tab
reale, mentre gli spazi sono riservati all'allineamento delle continuazioni. Gli
header pubblici devono inoltre documentare parametri, direzione, ownership, lifetime e
risultati. Premere il tasto Tab non basta se l'editor lo converte automaticamente in
spazi.

**Soluzione:** configurare l'editor per inserire tab nei file C, rimuovere gli spazi a
fine riga e completare Doxygen con `@param`, `@retval` o `@return`. Per vedere i
caratteri invisibili di una riga:

```sh
sed -n '33l' spaghetti_modules/ina219/ina219.c
```

`\t` rappresenta un tab reale; spazi o tab prima di `$` indicano whitespace finale.
La guida normativa è
[FIRMWARE_IMPLEMENTATION_GUIDE.md](FIRMWARE_IMPLEMENTATION_GUIDE.md).

**Verifica:** `make validate` e, durante una modifica locale,
`./validator percorso/del/file`.

**Risultato e regola permanente:** correggere prima il primo errore strutturale, perché
un parser confuso può produrre altri errori HDR secondari. Non disabilitare una regola
per aggirare la configurazione dell'editor.

### Il validator controllava file che la build non compilava

**Stato:** Risolto.

**Problema:** una scansione ricorsiva della cartella segnalava file futuri, incompleti
o non selezionati dalla build. Il risultato non rappresentava ciò che `make` avrebbe
compilato.

**Soluzione:** CMake valuta le proprietà `SOURCES` e `INCLUDE_DIRECTORIES` del target
`app` e le passa al validator. Gli header entrano attraverso il grafo reale degli
include. `make validate`, `make build`, `make pristine` e un `west build` diretto
condividono quindi lo stesso scope.

**Risultato e regola permanente:** il validator non deve tornare a scandire tutto il
repository per impostazione predefinita. Per controllare esplicitamente roadmap,
overlay o un file non compilato si passa il percorso a `./validator`. Dettagli in
[VALIDATOR.md](VALIDATOR.md).

## Compilazione e linking

### Header INA219 non trovato

**Stato:** Risolto.

**Sintomo:**

```text
fatal error: spaghetti_modules/ina219/ina219.h: No such file or directory
```

**Causa:** la forma dell'`#include` non corrispondeva alle directory esportate al
compilatore. Aggiungere `spaghetti_modules/ina219` agli include path rende disponibile
`<ina219.h>`, non automaticamente
`<spaghetti_modules/ina219/ina219.h>`.

**Soluzione adottata:** i driver concreti espongono il proprio include directory
privato dal `CMakeLists.txt` dell'applicazione e i chiamanti usano:

```c
#include <ina219.h>
```

**Verifica:** leggere il comando compiler completo o `compile_commands.json`, quindi
controllare che il percorso desiderato sia presente fra le opzioni `-I`.

**Risultato e regola permanente:** non correggere un include copiando header in
cartelle casuali. Decidere prima se il contratto è pubblico sotto `include/spaghetti/`
oppure privato del driver e mantenere coerenti include e CMake.

### `undefined reference to spaghetti_ina219_driver`

**Stato:** Risolto.

**Sintomo:** la compilazione degli header terminava, ma il linker non trovava il
descrittore `spaghetti_ina219_driver` usato dal Registry.

**Causa generale:** un errore di linker significa che la dichiarazione è visibile, ma
la definizione non è entrata nell'immagine con lo stesso nome e linkage. Le cause da
controllare sono: sorgente assente da `target_sources`, simbolo dichiarato `static`,
nome differente o compilazione condizionale non attiva.

**Soluzione adottata:** `spaghetti_modules/ina219/ina219.c` è una sorgente esplicita del
target `app`; `ina219.h` dichiara il descrittore con `extern` e il `.c` lo definisce con
linkage esterno.

**Risultato e regola permanente:** distinguere sempre:

- `No such file or directory`: problema di include/compilazione;
- `undefined reference`: problema di oggetto o simbolo al link.

Non aggiungere una seconda definizione nel Registry per far sparire l'errore.

## Hardware e Module

### INA219 initialization failed con `-19`

**Stato:** Atteso quando il sensore non è collegato.

**Sintomo:**

```text
INA219 initialization failed: -19
```

**Causa:** `-19` è `-ENODEV`: il controller o il dispositivo atteso non è disponibile.
Nel caso osservato INA219 non era fisicamente collegato.

**Soluzione:** collegare alimentazione, massa, SDA e SCL, verificare pull-up e indirizzo
I2C, oppure eseguire il firmware senza configurare quel Module. Non trasformare
l'assenza fisica in un falso successo.

**Risultato e regola permanente:** una build riuscita dimostra che il driver è stato
compilato; non dimostra che l'hardware risponda. Un Module assente deve fallire in modo
isolato senza fermare Communication o rendere inutilizzabile il Core.

### L'assunzione errata “una Port uguale un Module”

**Stato:** Risolto.

**Problema:** una Port I2C può ospitare contemporaneamente più dispositivi, per esempio
INA219 `0x40`, INA219 `0x41` e SHT40 `0x44`. Marcare la Port “occupata” rendeva
impossibile rappresentare un bus condiviso.

**Soluzione:** la relazione è Port 1:N Module. Un Module è identificato da una key
persistente e da Port, driver e configurazione/endpoint normalizzato. Il Manager offre
`get_by_key()` e `list_by_port()`; la vecchia ricerca singola per Port è ambigua. Ogni
driver possiede slab tipizzati per i propri context invece di un buffer universale.

**Risultato e regola permanente:** Port serializza il controller, ma non possiede i
Module e non limita artificialmente il bus a una sola istanza. Il rapporto completo è
in [PORT-MODULE-1-N-MIGRATION.md](roadmap/PORT-MODULE-1-N-MIGRATION.md).

## Config, storage e credenziali

### Password Wi-Fi nel repository o nella cronologia Shell

**Stato:** Risolto per il percorso di sviluppo; sicurezza fisica di produzione
rinviata.

**Problema:** passare la password come argomento la rende visibile nella history, nei
log e nei processi host. Inserirla in `prj.conf` o nell'overlay la porta nel repository
e nell'immagine.

**Soluzione:** `spaghetti wifi add` legge la password con input nascosto. Wi-Fi
Profiles la conserva in PSA ITS con trasformazione AES-GCM dentro la partizione NVS.
List, status e log espongono soltanto metadati non segreti. Le credenziali della console
remota e dell'OTA sono separate perché concedono autorizzazioni differenti.

**Risultato e regola permanente:** Config dei Module e credenziali di rete hanno owner
diversi. L'attuale chiave storage derivata dal device ID non è una root of trust contro
un attacco fisico: eFuse, Secure Boot, Flash Encryption e provisioning industriale
restano attività esplicite e potenzialmente irreversibili.

### Profilo Wi-Fi presente dopo reboot ma dubbi dopo il flash

**Stato:** Risolto come comportamento documentato.

**Comportamento:** un reboot e un normale `make flash` non sono comandi di factory
reset e la partizione NVS continua a contenere i profili, salvo modifica incompatibile
della mappa flash o cancellazione completa del chip. `make pristine` cancella e
ricostruisce gli artefatti host, non la flash del dispositivo.

**Verifica:** dopo il reboot eseguire:

```text
spaghetti wifi list
```

**Risultato e regola permanente:** distinguere sempre build pristine, flash delle
immagini e chip erase. Una futura funzione factory reset dovrà dichiarare esattamente
quali record elimina.

### `spaghetti wifi connect` fallisce ma il profilo esiste

**Stato:** Mitigato con stato e worker deterministici.

**Diagnosi corretta:** `spaghetti wifi list` separa profilo salvato, rete visibile,
stato del worker e ultimo errore. `wifi status` mostra invece l'interfaccia Zephyr.
Un profilo persistente non significa che una richiesta di connessione sia stata
accettata in quella modalità o che l'access point sia visibile.

**Soluzioni adottate:** un solo worker possiede scan e associazione; il profilo
preferito visibile viene provato per primo, altrimenti vengono provate le reti note in
ordine RSSI. Un ritardo iniziale evita di avviare il ciclo mentre rete e altri servizi
stanno ancora completando il boot.

**Risultato e regola permanente:** non interpretare un errno numerico isolato senza lo
stato del servizio. In `UNPROVISIONED` e `MAINTENANCE` i profili sono modificabili ma
la rete resta intenzionalmente offline.

## Console seriale e strumenti host

### `make screen` e `make monitor`

**Stato:** Risolto e documentato.

`make screen` è il terminale seriale grezzo. `make monitor` usa
`tools/device.py`, pyserial e Rich per autodetect, riconnessione, colori e tabelle. Non
sono lo stesso programma, anche se leggono la stessa UART. Solo un processo può aprire
la porta alla volta.

**Regola permanente:** usare `screen` come fallback minimale e `monitor` per il normale
sviluppo. Chiudere il monitor prima di flashare quando il runner richiede la stessa
porta.

### Dipendenze Rich/pyserial mancanti

**Stato:** Risolto.

**Sintomo:** `make monitor` chiedeva di installare globalmente `pyserial` e `rich`.

**Soluzione:** usare la virtual environment del repository:

```sh
make host-tools
source .venv/bin/activate
make monitor
```

**Risultato e regola permanente:** non installare dipendenze Python del progetto nel
Python di sistema. `tools/requirements.txt` è la fonte delle dipendenze host.

### Prompt `uart:~$` assente fino al primo Invio

**Stato:** Risolto.

**Cause incontrate:** Zephyr non ridisegnava sempre il prompt dopo una riconnessione;
aprire la USB Serial/JTAG poteva inoltre cambiare DTR/RTS e resettare ESP32-C3. Inviare
un ritorno a capo per svegliare la Shell aggiungeva una riga vuota alla history e
contribuiva allo sfasamento del comando precedente.

**Soluzione:** il monitor apre la porta senza attraversare la sequenza DTR/RTS di
boot/reset, disabilita `HUPCL` dove disponibile e invia `Ctrl-C` con tentativi bounded
finché vede il prompt. L'opzione `--no-wake` preserva un futuro protocollo binario.

**Risultato e regola permanente:** sincronizzare una Shell interattiva con un segnale
che non diventi un comando storico. Non assumere che aprire una porta seriale sia
un'operazione elettricamente neutra su USB Serial/JTAG.

### Colore del prompt e output difficili da leggere

**Stato:** Risolto.

**Problemi:** colorare artificialmente `uart:~$` produceva cambi di colore dopo reset
o comandi; gli output `wifi scan`, `wifi status` e gli help multilinea erano poco
leggibili.

**Soluzione:** il prompt viene inoltrato come byte terminali senza imporre uno stile.
Il formatter riconosce strutture note e usa tabelle Rich con bordi neutri, colonne e
colori soltanto per i dati che ne beneficiano. L'output firmware rimane testuale e
utilizzabile anche con `make screen`.

Il valore letterale `*float*` mostrato da `wifi status` non era una misura PHY: era il
segnaposto di `cbprintf` quando il supporto di formattazione floating point non era
disponibile. La build abilita `CONFIG_CBPRINTF_FP_SUPPORT`; il monitor conserva anche
un fallback esplicito “unavailable” invece di presentare `*float*` come dato valido.

**Risultato e regola permanente:** la presentazione appartiene al tool host, non al
protocollo firmware. Non cambiare il significato dei messaggi per renderli belli.

### Frecce e history della console remota

**Stato:** Risolto nel tool host corrente.

**Problema:** la console remota è un parser ristretto, non Zephyr Shell. Le sequenze
ANSI delle frecce spostavano il cursore locale o lasciavano sul dispositivo una riga
diversa da quella mostrata.

**Soluzione:** `NetworkLineEditor` mantiene una history host bounded a 32 elementi,
interpreta freccia su/giù, sostituisce sia la riga visibile sia quella già inviata al
peer e gestisce sequenze ANSI frammentate. Frecce laterali non supportate vengono
ignorate invece di corrompere il comando.

**Risultato e regola permanente:** la restricted network console non deve fingere di
essere una Shell completa. Editing e history restano nel client, mentre il firmware
riceve una linea coerente e bounded.

## Console remota autenticata

### Provisioning in timeout o modalità non riconosciuta

**Stato:** Risolto.

**Sintomi:**

```text
Timed out waiting for device response
The USB Shell did not return a recognizable Core mode
The Core did not accept Normal-mode activation
```

**Cause:** prompt residui potevano terminare prematuramente la lettura della risposta;
la PSK inviata tutta insieme poteva saturare il piccolo percorso RX; il tool doveva
gestire esplicitamente Normal, Maintenance e Unprovisioned, compresi reboot e
riconnessione USB.

**Soluzioni:** sincronizzazione sul prompt, pulizia bounded del buffer prima del primo
comando, invio cadenzato della PSK nascosta e flusso composto
`make remote-console-enable`. Quest'ultimo preserva una Config valida o installa una
Config vuota sicura, entra in Maintenance, provisiona e torna in Normal.

**Risultato e regola permanente:** il provisioning di una credenziale non deve
dipendere da un prompt casuale e non deve copiare la PSK in argv o history.

### Errori TLS `-113`, handshake ripetuti e socket esauriti

**Stato:** Risolto per l'implementazione corrente; memoria TLS da riprogettare.

**Sintomi:**

```text
TLS client accept failed: -113
TLS handshake error
Cannot allocate a new TCP connection
```

**Cause combinate accertate:** fallimenti di accept/invio non chiudevano sempre il
client nello stesso percorso; il loop poteva riutilizzare descrittori del poll
precedente immediatamente dopo un accept; il client host ritentava troppo rapidamente.
La libreria TLS aveva inoltre bisogno di un'arena sufficientemente grande per il
carico reale.

**Soluzione adottata:** chiusura centralizzata del client in ogni errore, nuovo ciclo
poll dopo accept, errori di send/receive propagati, pausa bounded prima della
riconnessione host e arena mbedTLS dedicata da 60.000 byte.

**Verifica:** connessione diretta autenticata:

```sh
make monitor TRANSPORT=network HOST=192.168.1.23
```

La console deve mostrare `network:~$`, accettare `help` e `spaghetti status`, quindi
liberare il client dopo `Ctrl-X` senza una tempesta di socket.

**Risultato e regola permanente:** i 60 KiB non possono essere rimossi ignorando il
motivo per cui furono aggiunti. La sostituzione futura deve ripetere handshake,
disconnessioni, retry e allocazioni fallite sotto carico.

### Device non trovato da `remote-console-list`

**Stato:** Mitigato.

**Diagnosi:** prima verificare sul dispositivo:

```text
spaghetti wifi list
wifi status
spaghetti remote status
```

`state=listening`, una credenziale presente e un indirizzo IP raggiungibile sono
prerequisiti distinti. La scansione richiede un subnet CIDR realmente instradato e la
stessa identità/PSK. Quando l'IP è noto, la connessione diretta è la prova più semplice.

**Risultato e regola permanente:** la discovery della console accetta soltanto peer che
completano l'autenticazione; non deve annunciare in chiaro la presenza del servizio e
non sostituisce routing, firewall o VPN.

## Boot, MCUboot e aggiornamenti

### Modalità del Core non visibile nei log

**Stato:** Risolto.

Il boot ora riporta separatamente modalità operativa, stato immagine, slot,
conferma e versione, per esempio:

```text
boot: mode=unprovisioned image=confirmed slot=0 confirmed=1 version=0.1.0+0
```

**Risultato e regola permanente:** `NORMAL/MAINTENANCE/UNPROVISIONED` e
`TRIAL/CONFIRMED` sono dimensioni indipendenti. `NORMAL + TRIAL` è valido durante la
health window; non introdurre una modalità unica che mescoli le due cose.

### Verifica di MCUboot e immagini A/B

**Stato:** Risolto per build e boot di sviluppo.

Sysbuild produce MCUboot e l'applicazione firmata. `tools/device.py flash --dry-run`
ha mostrato gli offset reali estratti dai runner generati invece di indirizzi copiati
nel Makefile. Una nuova immagine parte come trial e diventa confermata soltanto dopo
che Core raggiunge RUNNING e supera la health window. Un reset precedente permette il
rollback.

**Risultato e regola permanente:** l'applicazione in esecuzione non conferma una
immagine durante l'upload. MCUboot verifica la firma prima dell'esecuzione e Update
scrive soltanto lo slot secondario.

### `update-qualification-check` elenca tutti i casi Pending

**Stato:** Atteso finché non sono registrate prove fisiche.

Il manifest con hash, versioni e metadata dimostra che gli artefatti sono identificati;
non dimostra interruzioni, rollback e recovery. `Final results: 0` seguito dai casi
`Q-*` pending è quindi il gate che rifiuta una qualificazione incompleta, non un errore
del firmware.

**Risultato e regola permanente:** non marcare la fase 290 completata usando fake o un
manifest vuoto. Le evidenze hardware vengono aggiunte progressivamente mentre ESP32-C3
e i prototipi sono disponibili.

## Crash, stack e RAM

### Instruction Access fault subito dopo il boot

**Stato:** Mitigato; la pressione sugli stack è stata misurata.

**Sintomo:** eccezione CPU con program counter/return address non validi mentre il log
indicava il thread idle. Questo pattern è compatibile con corruzione di memoria, ma il
solo crash dump non dimostra quale buffer l'abbia causata.

**Evidenza successiva:** il percorso PSA ITS/AES-GCM durante il boot richiedeva più
stack del default precedente; Wi-Fi Profiles documenta che 2048 byte erano
insufficienti e potevano corrompere lo stack adiacente. Gli stack sono stati resi
espliciti e il comando `kernel thread stacks` viene usato per misurare il watermark.

**Risultato e regola permanente:** non attribuire automaticamente ogni Instruction
Access fault all'idle thread mostrato nel dump. Il thread corrente può essere la
vittima della corruzione. Conservare il call trace, aumentare temporaneamente i margini
e misurare il percorso che usa crypto, rete e logging.

### Shell al 96% e riduzione degli stack

**Stato:** Risolto per i carichi provati, da ripetere quando arrivano BLE e MQTT TLS.

Misure osservate:

```text
shell_uart 4096 byte: 3972 usati, 96%
shell_uart 5120 byte: 3972 usati, 77%
wifi_profiles_worker 4096 byte: 2440 usati, 59%
spaghetti_remote 6144 byte: picchi osservati fra 33% e 66%
logging 768 byte: circa 384-400 usati nei test osservati
```

La Shell è stata portata a 5120 byte invece di ridurla. Lo stack logging è stato
ridotto dopo misura. Stack OTA e MQTT apparentemente vuoti non sono stati ridotti,
perché i percorsi pesanti non erano ancora stati esercitati.

**Risultato e regola permanente:** dimensionare sul massimo percorso realmente
eseguito più margine, non sulla percentuale a boot. Ripetere le misure con scan Wi-Fi,
TLS, OTA, errori, log flood, BLE e numero massimo di Module.

### IRQ stack al 100%

**Stato:** Mitigato; misura non usata come unica prova.

Il watermark IRQ su ESP32-C3/RISC-V è risultato al 100% anche aumentando molto lo
stack, indicando che inizializzazione/strumentazione può sporcare tutta l'area e
rendere il watermark poco rappresentativo del normale uso. L'override sperimentale è
stato rimosso.

**Risultato e regola permanente:** non continuare ad aumentare RAM sulla base del solo
watermark IRQ. Servono crash riproducibile, canary affidabile o misura supportata dalla
porta Zephyr.

### RAM statica circa all'85%

**Stato:** Pianificata una soluzione architetturale.

La build ESP32-C3 ha mostrato circa 307 KiB usati su 365 KiB disponibili, lasciando
circa 58 KiB statici. Una prima revisione degli stack ha recuperato circa 4,6 KiB, ma
ha anche mostrato che micro-ottimizzare stack non esercitati sarebbe pericoloso.

I principali blocchi individuati sono:

- arena privata mbedTLS da 60.000 byte;
- heap aggiuntivo richiesto dal Wi-Fi Espressif;
- stack statici di servizi che non lavorano sempre;
- buffer e code di rete, Shell, MQTT, OTA e console remota.

**Risultato e regola permanente:** il problema non si risolve tagliando alla cieca.
Servono profili Core, lifecycle dei servizi, capacità bounded e prove del caso peggiore.

### Perché esiste l'arena mbedTLS da 60 KiB e come verrà sostituita

**Stato:** Pianificato, non ancora implementato.

L'arena fu aggiunta per stabilizzare TLS. Non contiene il firmware OTA completo e non
è una feature: è memoria di lavoro esclusiva per handshake, record, cifratura e
contesti. Resta però sottratta al resto del firmware anche senza connessioni.

La decisione congelata è mantenere mbedTLS e le funzioni TLS/DTLS, ma sostituire
l'arena sempre residente con un workspace bounded acquisito quando serve. Sul profilo
Minimal una sola operazione TLS pesante è ammessa: MQTT si disconnette prima di OTA e
la console remota di produzione non viene compilata.

**Prove obbligatorie prima della rimozione:**

- console e MQTT TLS con credenziale corretta ed errata;
- handshake ripetuti e disconnessioni durante l'handshake;
- OTA Wi-Fi completo, timeout e perdita rete;
- allocazione fallita senza perdita di Config o immagine confermata;
- Wi-Fi e BLE logicamente connessi nello stesso carico;
- assenza di leak o frammentazione dopo cicli ripetuti.

Il contratto completo è in
[CONNECTIVITY_AND_RESOURCE_CONTRACT.md](CONNECTIVITY_AND_RESOURCE_CONTRACT.md).

## Decisioni di connettività ed energia derivate

### BLE-first e Wi-Fi on-demand

**Stato:** Pianificato.

Per un Core a basso consumo, il risultato delle analisi è:

```text
NORMAL + LOW_ENERGY
    Runtime attivo
    BLE spento, advertising o connesso secondo policy
    Wi-Fi, MQTT, OTA e TLS spenti

NORMAL + ONLINE
    Runtime attivo
    BLE verso un peer
    Wi-Fi/MQTT verso un altro peer
```

Un peer BLE autenticato può richiedere una lease Wi-Fi temporanea, una sessione di
manutenzione di rete o un aggiornamento. Abilitare Wi-Fi non apre automaticamente OTA
o console remota. Maintenance e Update hanno timeout e non diventano Config persistente.

**Risultato e regola permanente:** BLE è un adapter del protocollo CBOR comune, non un
secondo modello Config. Node-RED può comunicare direttamente via BLE su un host locale
oppure attraverso una base; MQTT sul Core non è obbligatorio.

### ESP32-C3, S3, C6, Matter e Zigbee

**Stato:** Decisione hardware aperta, confine architetturale congelato.

- ESP32-C3 offre Wi-Fi e BLE, ma non IEEE 802.15.4; Wi-Fi e BLE condividono la radio e
  possono essere logicamente attivi mentre l'accesso RF viene alternato.
- ESP32-S3 offre più SRAM e può avere PSRAM. Supporta Matter over Wi-Fi, ma non Matter
  over Thread senza una radio 802.15.4 esterna.
- ESP32-C6 integra Wi-Fi, BLE e IEEE 802.15.4 per Thread/Zigbee, ma disponibilità e RAM
  dello stack concreto devono essere verificate con Zephyr e l'hardware scelto.

**Risultato e regola permanente:** Matter, Thread e Zigbee non sono requisiti V1. Una
base può fare bridge BLE-MQTT/Matter/Zigbee senza caricare questi stack su ogni Core.
Non dichiarare una capability soltanto perché il SoC potrebbe supportarla.

## Problemi ancora aperti

Queste voci non hanno ancora una soluzione implementata:

| Area | Stato reale |
|---|---|
| Discovery hardware | Rinviata finché EEPROM, registri, analogico, 1-Wire o presence non sono definiti su hardware reale. |
| Qualificazione update | Fase 290 pronta, ma prove fisiche e risultati `Q-*` ancora pending. |
| Root of trust | Provider device-ID solo di sviluppo; eFuse, Secure Boot, Flash Encryption e debug policy da progettare. |
| MQTT di produzione | Trasporto corrente non sicuro; TLS, autenticazione broker e protocollo bidirezionale sono futuri. |
| BLE | Architettura congelata, adapter GATT, autenticazione, framing e OTA non ancora implementati. |
| Memoria TLS dinamica | Arena statica ancora presente; sostituzione e stress test non ancora implementati. |
| Low power | Nessuna dichiarazione finale finché non vengono misurati consumi e tempi sul PCB definitivo. |
| Matter/Zigbee | Fuori dalla V1; eventuale valutazione ESP32-C6 o gateway successiva. |

Il dettaglio delle decisioni hardware rinviate è in
[PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md](PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md).

## Modello per aggiungere un nuovo incidente

Quando un problema nuovo viene risolto, aggiungi una voce usando questo schema:

```text
### Titolo riconoscibile dal sintomo

Stato: Risolto / Atteso / Mitigato / Pianificato / Rinviato
Sintomo: output completo e condizioni in cui compare
Causa: solo ciò che è stato dimostrato
Soluzione: modifica o procedura adottata
Verifica: comando, carico e risultato atteso
Risultato e regola permanente: cosa non dobbiamo dimenticare
```

Se la causa non è stata dimostrata, scrivi **Mitigato** e conserva le ipotesi come tali.
Una coincidenza temporale dopo una modifica non è una root cause.

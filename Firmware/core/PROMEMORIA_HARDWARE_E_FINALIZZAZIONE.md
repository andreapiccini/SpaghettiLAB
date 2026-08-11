# Promemoria hardware e finalizzazione firmware

[← Diario problemi e decisioni](DIARIO_PROBLEMI_SOLUZIONI_E_DECISIONI.md) ·
[Contratto connettività e risorse](CONNECTIVITY_AND_RESOURCE_CONTRACT.md)

Questo documento raccoglie ciò che è intenzionalmente incompleto o simulato nel
firmware Spaghetti LAB. Usalo quando progetti la scheda definitiva e come prompt per
completare il firmware senza inventare dettagli hardware.

**Stato del documento:** 11 agosto 2026, dopo il completamento della fase 190.

## Prima di progettare la scheda

Conserva per ogni revisione hardware:

- schema elettrico completo e numero di revisione;
- datasheet e reference design dei componenti;
- tabella con connettori, pin, tensioni, direzioni e safe state al reset;
- distinta delle rail, corrente massima, sequenza di accensione e proprietari;
- metodo di programmazione, console, debug e procedura di produzione;
- mappa flash definitiva, incluse le eventuali partizioni per aggiornamento firmware;
- elenco dei meccanismi hardware realmente presenti per identificare e rilevare i
  Module.

Devicetree deve contenere soltanto fatti verificati su questi documenti. Dopo ogni
modifica controlla sempre `build/zephyr/zephyr.dts` e `build/zephyr/.config`.

## Cose ancora da completare

### 1. Engine completo e pulizia finale

**Situazione attuale:** l'Engine del task 200 è implementato. La pulizia 210 è ancora
aperta; le fasi 300–390 rendono generici schema, protocolli, trasporti, Discovery e
integrazione Node-RED prima del freeze V1.

**Da fare:**

- completare
  `roadmap/210-finalizzazione/TASK-210-01-ripulire-e-qualificare-il-firmware.md`;
- rimuovere shortcut, wrapper e valori temporanei, quindi provare boot, apply,
  rollback, remove, reboot e più Module sulla stessa Port.
- implementare in ordine il
  `roadmap/V1-PLATFORM-CLOSURE.md`, mantenendo compilabile ogni fase;
- superare il gate Node-RED con fake prima di dipendere dai Module fisici.

**Fine:** `main()` avvia soltanto l’engine definitivo; non rimangono configurazioni di
bring-up nascoste e l’intera matrice di test passa.

### 2. Alimentazione controllabile delle Port

**Situazione attuale:** Core V1 non dichiara una rail controllabile. Power implementa
ownership, reference counting e rollback, ma viene compilato fuori dalla produzione.
Il backend hardware non esiste; `tests/power` usa un fake.

**Decisioni hardware necessarie:**

- quali Port condividono ogni rail;
- tensione e corrente massima;
- load switch o regulator scelto;
- pin enable, polarità e stato durante reset/boot;
- tempo di stabilizzazione e tempo di scarica;
- protezione da corto, sovracorrente, ESD e alimentazione inversa;
- comportamento quando un Module viene inserito o rimosso a caldo.

**Da implementare dopo lo schema:**

- estendere il binding sotto `dts/bindings/spaghetti/` con una proprietà verificata;
- aggiungere il descrittore reale nel DTS della nuova board;
- implementare il backend GPIO/regulator in `subsys/power/power.c`;
- abilitare `CONFIG_SPAGHETTI_POWER` solo sulla variante che possiede la rail;
- inizializzare Power dal Core;
- far acquisire al Module Manager la risorsa prima di `driver->ops->init()` e
  rilasciarla dopo `deinit()` o durante ogni rollback;
- usare il Module ID come owner: più Module sulla stessa Port restano distinti;
- misurare first-on/final-off e provare i fallimenti reali.

**Fine:** pin e polarità corrispondono allo schema; due Module condividono la rail e la
rimozione del primo non toglie alimentazione al secondo.

### 3. Port digitali e Relay reale

**Situazione attuale:** il Relay Driver è registrato e testato con una Port fake, ma
Core V1 espone solo I2C. Una Config Relay reale restituisce correttamente `-ENOTSUP`.

**Decisioni hardware necessarie:**

- GPIO fisico della Port e polarità;
- stato sicuro durante reset, boot, crash e aggiornamento;
- transistor/MOSFET o driver, flyback, isolamento e limiti elettrici;
- tipo di carico ammesso e proprietà esclusiva della Port;
- eventuale feedback che confermi lo stato reale dell’uscita.

**Da implementare dopo lo schema:**

- estendere il binding Port con la capability digital-output e il riferimento GPIO;
- descrivere la Port reale nel DTS della board;
- implementare `spaghetti_port_set_output()` sul GPIO Zephyr verificato;
- provare active-high, active-low, safe state, errore del controller e reboot;
- verificare con strumenti di misura che il carico non venga attivato durante il boot.

**Fine:** il Relay comanda hardware reale e ritorna sempre allo stato sicuro nei
percorsi init, deinit ed errore.

### 4. Discovery automatico dei Module

**Situazione attuale:** Discovery accetta risultati manuali e gestisce più key per
Port, ma `spaghetti_discovery_scan_port()` restituisce `-ENOTSUP`. Una scansione I2C
non basta a identificare con certezza il tipo di Module.

**Decisioni hardware necessarie:** scegliere un’identità affidabile, per esempio una
EEPROM con record versionato, un componente di identificazione, pin dedicati o un
protocollo definito dal Module. Definire anche rilevamento presenza/rimozione,
alimentazione necessaria alla lettura e collisioni sul bus.

**Da implementare dopo avere scelto il meccanismo:**

- documentare formato, versione, CRC/autenticità, limiti e assegnazione della Module
  key;
- creare un provider board-specific che implementa
  `struct spaghetti_discovery_provider_ops`;
- emettere zero, uno o più risultati per Port senza assumere Port = Module;
- integrare eventi di inserimento/rimozione con generation e timeout bounded;
- non effettuare probe distruttivi e non associare un indirizzo a un driver per
  supposizione;
- verificare moduli multipli, dispositivo sconosciuto, record corrotto, timeout,
  rimozione e reinserimento.

**Fine:** il firmware identifica automaticamente un Module tramite un dato hardware
autorevole e rimuove soltanto la key interessata.

### 5. Sicurezza Wi-Fi e protezione fisica del dispositivo

**Situazione attuale:** le password non entrano nel repository o nella history e sono
salvate con PSA ITS e AES-GCM. Zephyr 4.4 deriva però la chiave dal device ID e avverte
che non è una root of trust resistente a un attacco fisico. Secure Boot, Flash
Encryption, debug policy ed eFuse non sono configurati dal firmware.

**Decisioni di produzione necessarie:**

- threat model e livello di protezione richiesto;
- root key hardware/eFuse e responsabilità di provisioning;
- Secure Boot e firma delle immagini;
- Flash Encryption;
- politica JTAG/UART download e recupero dispositivi;
- rotazione, cancellazione e reset delle credenziali;
- conservazione sicura delle chiavi di produzione e tracciabilità.

**Da implementare:**

- verificare sulle fonti ufficiali Espressif e Zephyr la procedura adatta alla revisione
  SoC realmente montata;
- sostituire il provider device-ID con una root hardware verificata;
- creare una procedura di manufacturing separata, esplicita e ripetibile;
- aggiungere una modalità di factory reset che cancelli Config, profili Wi-Fi e altri
  segreti secondo una policy definita;
- provare aggiornamento, recovery e perdita di alimentazione durante il provisioning.

**Attenzione:** bruciare eFuse o disabilitare debug può essere irreversibile. Non farlo
mai automaticamente e non eseguire questi comandi senza approvazione esplicita.

### 6. MQTT cifrato e autenticato

**Situazione attuale:** MQTT usa QoS 0, retain false e TCP non cifrato, normalmente
sulla porta 1883. TLS e autenticazione broker non sono implementati.

**Decisioni necessarie:**

- broker e porta di produzione;
- CA trust anchor e verifica hostname;
- autenticazione con username/password oppure certificato client;
- luogo e procedura di provisioning/rotazione dei segreti;
- policy QoS, retain, Last Will, scadenza e comportamento offline;
- identità univoca del Core e formato definitivo dei topic.

**Da implementare:**

- estendere Config e codec CBOR in modo versionato e retrocompatibile;
- usare il trasporto TLS Zephyr con verifica del server obbligatoria;
- conservare i segreti fuori dai log e, se persistenti, nella secure storage;
- definire limiti statici per certificati, code e buffer;
- testare certificato errato/scaduto, hostname errato, broker assente, riconnessione e
  coda piena senza bloccare Runtime.

**Fine:** nessun campione o segreto attraversa la rete in chiaro e un broker non
autenticato viene rifiutato.

### 7. Protocollo seriale per l’app

**Situazione attuale:** Communication possiede richieste e risposte generiche, ma
l’unico adapter è Zephyr Shell. La Shell resta utile per sviluppo e provisioning; non
è ancora definito un protocollo macchina per l’app.

**Decisioni necessarie:**

- USB CDC/UART/BLE o altro trasporto;
- framing, versione, lunghezza, checksum e timeout;
- formato CBOR delle richieste e delle risposte;
- correlation ID, errori, retry e richieste duplicate;
- accesso alle operazioni sensibili e modalità di provisioning;
- convivenza tra console log, Shell e protocollo macchina.

**Da implementare:** creare un adapter che costruisca
`struct spaghetti_request`, chiami
`spaghetti_communication_handle_request()` e serializzi la risposta, senza chiamare
direttamente Config o Manager. Fare fuzz/test su frame troncati, sovradimensionati,
duplicati e sconosciuti. Non rimuovere la seriale di recovery finché non esiste una
procedura alternativa verificata.

**Fine:** l’app configura e interroga il Core con un protocollo versionato, mentre la
Shell di manutenzione rimane disponibile secondo la policy scelta.

### 8. Variante Core di produzione

**Situazione attuale:** `spaghettilab_core_v1` descrive l’hardware ESP32-C3 corrente.
`spaghettilab_core_v2_build_only` verifica soltanto la portabilità e non deve essere
flashata.

**Da fare per ogni PCB definitivo:**

- creare una nuova board Zephyr basata sul vero schema, senza copiare pin simulati;
- verificare SoC, flash, PSRAM se presente, oscillatori, antenna, USB, console e runner;
- descrivere tutte e sole le Port fisiche con controller e capability reali;
- verificare partizioni, storage, allineamenti e spazio per la strategia di update;
- costruire e provare la variante separatamente senza `#ifdef` sul nome board nel C
  comune;
- archiviare `zephyr.dts`, `.config`, map file e risultati hardware della revisione.

**Fine:** ogni variante selezionabile rappresenta una scheda reale oppure porta
esplicitamente il suffisso `build_only` e non dispone di runner di flash.

### 9. Qualificazione elettrica e affidabilità

Questa parte non deve essere dedotta dal firmware. Prima della produzione definisci e
prova almeno:

- pull-up e capacità del bus I2C con tutti i Module previsti;
- indirizzi I2C configurabili e gestione delle collisioni;
- inserzione a caldo, back-powering, ESD, corto e brownout;
- boot senza Module, Module guasto e disconnessione durante una transazione;
- perdita di alimentazione durante scrittura Config, Wi-Fi e secure storage;
- durata/endurance della flash e frequenza massima delle scritture;
- consumo nelle condizioni reali e limiti termici;
- watchdog, recovery e aggiornamento firmware, se richiesti dal prodotto;
- test prolungato con Wi-Fi, MQTT, Runtime e più Module simultanei.

OTA e console remota sono ora pianificati nelle fasi 220–290. Il Maintenance Link è
indipendente dai pin: Core V1 riusa GPIO3/GPIO4 come I2C oppure UART, mentre ogni altra
board/overlay deve fornire la stessa capability con il proprio hardware. Config assente
entra direttamente in maintenance UART locale; con Config valida si usa un payload
bounded nella finestra di boot oppure un marker one-shot seguito da reboot. Watchdog e
low-power globale richiedono comunque implementazione e qualificazione dedicate.

## Ordine consigliato

1. Esegui la parte automatizzabile del task 210 e registra i casi fisici rinviati.
2. Implementa le fasi software 300–390 con fake e congela Protocol V1.
3. Passa allo sviluppo principale Node-RED usando catalogo e MQTT V1.
4. Congela schema, pinout e requisiti della scheda definitiva.
5. Crea la nuova variante board e verifica Port/capability.
6. Implementa Power, Relay e provider Discovery reali soltanto se presenti.
7. Completa i casi hardware 210, sicurezza production e qualificazione fisica 290.

## Prompt da usare per completare il lavoro

Copia il testo seguente e allega schema, datasheet, pinout e requisiti aggiornati.

```text
Completa le parti hardware-dependent e production-ready del firmware Spaghetti LAB.

Prima di modificare qualsiasi file:
1. leggi completamente FIRMWARE_IMPLEMENTATION_GUIDE.md;
2. leggi PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md;
3. ispeziona repository, git status, roadmap, board DTS/binding e build corrente;
4. ispeziona la versione Zephyr installata e usa soltanto API/binding realmente
   disponibili in quella versione;
5. confronta ogni pin, polarità, rail, controller, indirizzo e safe state con gli
   schemi e datasheet allegati;
6. segnala ogni informazione mancante o contraddittoria e non inventarla.

Hardware e requisiti allegati:
- revisione PCB: <INSERIRE>;
- schema: <ALLEGARE O INDICARE PERCORSO>;
- datasheet/BOM: <ALLEGARE O INDICARE PERCORSO>;
- pinout e connettori: <ALLEGARE>;
- rail condivise e sequenze: <INSERIRE>;
- metodo di identificazione Module: <INSERIRE>;
- requisiti Relay/output: <INSERIRE>;
- protocollo richiesto dall’app: <INSERIRE>;
- broker, TLS e autenticazione: <INSERIRE SENZA INCOLLARE SEGRETI>;
- modello di sicurezza e processo eFuse: <INSERIRE>;
- strategia update/recovery: <INSERIRE>.

Mantieni l’architettura:
Port -> Module Driver -> Registry -> Module Manager -> Config -> Runtime -> Data ->
Communication/MQTT.

Mantieni Port -> Module come relazione 1:N. Un Module è identificato da key, driver,
Port ed endpoint/config del driver; una Port I2C non è occupata da un solo Module.
Mantieni memoria deterministica senza heap nel codice Spaghetti e conserva ownership,
lifetime, errno, timeout, rollback e thread context espliciti.

Procedi in questo ordine:
- completa prima i task roadmap 200 e 210 se sono ancora TODO;
- crea o aggiorna una board Zephyr per la revisione hardware reale;
- implementa solo le capability fisicamente presenti;
- collega il backend Power reale e il Manager solo se esiste una rail controllabile;
- abilita Relay solo su una Port digital-output verificata;
- implementa Discovery automatico solo con un’identità hardware autorevole;
- definisci e implementa l’adapter seriale versionato per l’app;
- sostituisci MQTT plaintext con TLS autenticato;
- sostituisci la chiave Wi-Fi derivata dal device ID con la root hardware approvata e
  documenta la procedura di produzione.

Non bruciare eFuse, non disabilitare debug, non usare credenziali reali e non eseguire
azioni irreversibili senza mia approvazione esplicita. Non inserire segreti nel repo,
nei log, nei comandi o nei test.

Per ogni modifica:
- aggiorna documentazione e roadmap coerenti;
- aggiungi test fake/native per successi, limiti ed errori;
- aggiungi test hardware misurabili quando necessario;
- esegui validator, Twister e build pristine per ogni board reale;
- controlla zephyr.dts, .config e sorgenti effettivamente inclusi da CMake;
- preserva le modifiche locali non correlate.

Alla fine riporta:
- cosa era già implementato e cosa mancava;
- quali fatti hardware sono stati verificati e da quale documento;
- file modificati;
- API e flussi implementati;
- test eseguiti e risultati;
- limiti o decisioni ancora aperte;
- eventuali operazioni production irreversibili ancora da eseguire manualmente.
```

Aggiorna questo promemoria quando una voce viene completata: non cancellare la storia
della decisione hardware, ma marcala come completata indicando revisione PCB, commit e
prova eseguita.

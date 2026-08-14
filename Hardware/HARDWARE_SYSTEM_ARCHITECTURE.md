# Architettura fisica del sistema SpaghettiLAB

## Scopo del documento

Questo documento descrive come è composto fisicamente il sistema modulare
SpaghettiLAB e definisce il significato dei suoi elementi principali. Serve come
riferimento comune per hardware, firmware e software prima di definire i dettagli dei
singoli PCB.

Non è una specifica elettrica di produzione. Non congela:

- dimensioni, passo o famiglia dei connettori;
- tensioni e correnti definitive;
- numero definitivo dei contatti;
- pinout irreversibili;
- protezioni, isolamento o certificazioni;
- forma degli involucri e sistema di fissaggio;
- circuito interno dei moduli.

I valori e i collegamenti non ancora provati sono indicati esplicitamente come
contratto di lavoro modificabile. Non devono essere interpretati come caratteristiche
già verificate.

## Idea generale

SpaghettiLAB è un sistema componibile nel quale una **Backbone** collega fisicamente
uno o più **Core**, gli **Interface Module** di campo, gli eventuali **Link Module**
verso host e rete, i relativi **Connector** e il sottosistema di alimentazione.

Il sistema non richiede un modulo hardware diverso per ogni sensore commerciale. Un
sensore o attuatore esterno viene collegato attraverso:

```text
External Device → Connector → Interface Module → Backbone → Core
```

Per un'uscita il percorso logico è opposto:

```text
Core → Backbone → Interface Module → Connector → External Device
```

L'Interface Module è specifico dell'interfaccia elettrica, non necessariamente del
dispositivo finale. La stessa interfaccia può quindi servire molti dispositivi diversi.
Esempi di famiglie possibili sono I2C, SPI, UART, RS-232, RS-485, ingresso analogico,
ingresso optoisolato e uscita pilotata. L'elenco non definisce quali moduli siano già
progettati o disponibili.

La modularità deve funzionare anche con composizioni molto piccole: un nodo può essere
formato soltanto dagli elementi indispensabili e trovare posto dentro un prodotto, una
scatola tecnica o un altro volume ristretto. Questa è un'intenzione di formato, non una
dichiarazione di idoneità normativa per installazioni a tensione di rete.

## Terminologia canonica

### System

Una composizione completa e funzionante formata da almeno Backbone, Core e una sorgente
di alimentazione, alla quale possono essere aggiunti Interface Module, Connector ed
External Device.

### Backbone

La base fisica passiva sulla quale vengono inseriti gli altri elementi. La Backbone:

- mantiene l'ordine e la posizione dei moduli;
- realizza i collegamenti fra Core e Bay;
- distribuisce massa e le alimentazioni disponibili;
- rende la composizione compatta e sostituibile senza cablaggi interni fra ogni modulo;
- espone le posizioni previste per Core Bay, Function Bay, Link Bay e Power Bay.

La prima famiglia prevista è una **Compact Backbone**, destinata sia a piccoli nodi
autonomi sia a composizioni più estese.

La lunghezza e il numero di Bay possono cambiare fra diverse Compact Backbone, purché
il contratto meccanico ed elettrico adottato dalla relativa famiglia sia compatibile
con i moduli dichiarati.

### Core

Il Core è l'elemento di calcolo e comunicazione del sistema. Termina i Flow funzionali,
configura e utilizza le interfacce disponibili e comunica con il software esterno.

Il Core non deve contenere fisicamente ogni possibile interfaccia per sensori e
attuatori. Queste funzioni appartengono agli Interface Module montati nelle Function
Bay. Radio e USB sul modulo Core restano valide: Wi‑Fi e/o Bluetooth sul micro **non
vengono rimossi** da questa estensione. Un Link Module nella Link Bay è un'interfaccia
**in più**, non un sostituto. Togliere radio da un micro con poca RAM è una decisione
futura di variante Core, non un requisito di questa architettura.

Un Core può avere almeno:

- un Flow orientato dal campo verso il Core;
- un Flow orientato dal Core verso il campo;
- il collegamento al sottosistema Power della Backbone;
- se avanzano sul micro, tre GPIO spare sul **Link bus** (non richiesti dal bare
  minimum).

L'ESP32-C3 è la board **bare minimum**: benchmark di RAM, flash, radio e pin per il
nodo più piccolo. Port di campo, USB Serial/JTAG e pin di strapping/flash restano
quelli del minimo. I tre `LINK` si prendono solo da ciò che su quel micro **avanza**.
Una variante più ricca può esporre gli stessi tre ruoli su GPIO diversi; non può
pretendere pin che sul C3 minimo sono già occupati.

Varianti future del Core possono esporre un numero diverso di Flow, senza cambiare il
significato dei termini.

### Flow

Un Flow è un percorso fisico ordinato di segnali attraverso la composizione. Descrive
come una parte della Backbone collega il campo al Core o il Core al campo; non è un
singolo filo e non coincide con una Bay.

Sono distinti due ruoli.

#### Function Flow

Trasporta i segnali funzionali fra un External Device e il Core attraverso Connector e
Interface Module.

Un Function Flow può essere:

- **Input Flow**, orientato dal campo verso il Core;
- **Output Flow**, orientato dal Core verso il campo;
- in futuro bidirezionale, se hardware e interfaccia lo richiederanno.

Le parole input e output sono sempre riferite al Core.

#### Power Flow

È il percorso dedicato agli stadi di alimentazione. Può contenere più Power Bay in
sequenza, così che l'uscita di uno stadio possa alimentare l'ingresso dello stadio
successivo.

Esempio puramente funzionale:

```text
Power Input → Power Module / stadio 1 → Power Module / stadio 2 → rail disponibili
```

Questo consente di comporre alimentazioni con più trasformazioni successive. Un
Power Module AC che riduce o converte una tensione è un possibile esempio, non un
pinout o circuito già congelato.

Le uscite utili prodotte dai Power Module diventano rail distribuite dalla Backbone
alle Bay del sistema, comprese le Bay del lato di uscita.

### Bay

Una Bay è una posizione fisica ordinata della Backbone destinata a ricevere un modulo.
La Bay definisce una collocazione, non la funzione del componente inserito e non il
protocollo usato.

La Bay più vicina al campo è distinta da quella più vicina al Core attraverso la sua
posizione nel Flow. L'ordine deve rimanere identificabile anche se la direzione
elettrica del Flow cambia.

Esistono quattro ruoli principali:

- **Core Bay**, posizione in cui si inserisce un Core;
- **Function Bay**, per un Interface Module verso il campo;
- **Link Bay**, per un Link Module verso host, manutenzione o rete;
- **Power Bay**, per un Power Module appartenente al Power Flow.

La stessa forma meccanica può essere riutilizzata dove compatibile, ma questo non rende
automaticamente intercambiabili Core, Interface Module, Link Module e Power Module. Una
Backbone può avere più Core Bay: i Core sulla stessa Backbone si vedono attraverso il
Link bus, non attraverso i Function Flow.

### Module

Module è il termine generale per un elemento funzionale sostituibile inserito in una
Bay. In questa architettura le categorie fisiche principali sono:

- **Interface Module**, inserito in una Function Bay (campo: I2C, UART, GPIO, …);
- **Link Module**, inserito in una Link Bay (host/rete: USB‑C, RS‑232, Ethernet,
  Wi‑Fi, Bluetooth, …);
- **Power Module**, inserito in una Power Bay.

Il Core è un elemento sostituibile inserito in una Core Bay ma mantiene il nome Core,
perché ha il ruolo specifico di elaborazione e terminazione dei Flow. Connector ed
External Device non vengono chiamati Module. Un Link Module non è un Interface Module:
il primo parla con host o con altri Core, il secondo con il campo.

### Bay Interconnect

Il Bay Interconnect è il sistema di contatto elettrico e accoppiamento fra Backbone e
modulo inserito nella Bay. È distinto dal Connector rivolto all'External Device.

Il contratto architetturale definisce il numero e il significato logico dei contatti,
ma non la tecnologia con cui vengono realizzati. Il Bay Interconnect potrà quindi
essere implementato, dopo prototipazione, con contatti a molla, pogo pin, accoppiamento
magnetico, connettori maschio/femmina, contatti sul bordo del PCB o un'altra soluzione
adatta.

Un eventuale magnete appartiene al sistema meccanico di allineamento e ritenzione; non
modifica da solo direzione, pinout o compatibilità elettrica. La possibilità di
accoppiare fisicamente due parti non deve rendere compatibili revisioni elettriche
diverse.

### Interface Module

Un Interface Module occupa una Function Bay e realizza il confine elettrico fra il
Core e il dispositivo esterno.

Può svolgere una o più delle seguenti funzioni:

- adattamento di livello o formato elettrico;
- protezione;
- isolamento, quando previsto dal modulo specifico;
- conversione fra i segnali del Core e un bus o ingresso/uscita esterno;
- esposizione dei segnali richiesti al Connector.

Un Interface Module rappresenta una capacità elettrica riusabile. Non rappresenta
necessariamente uno specifico sensore. Il comportamento del dispositivo collegato può
essere descritto separatamente dal software e dal firmware.

La forma meccanica dei moduli dei due lati può essere comune. La reversibilità fisica
non implica reversibilità elettrica: un ingresso optoisolato e un'uscita pilotata, per
esempio, restano funzioni differenti.

### Connector

Il Connector è la terminazione fra SpaghettiLAB e l'External Device. Determina la forma
del collegamento esterno, il pinout utilizzabile e l'eventuale cavo, ma non sostituisce
l'adattamento elettrico dell'Interface Module.

Può essere:

- integrato o accostato alla composizione per componenti compatti;
- collegato tramite un cavo ordinato quando il sensore deve essere collocato altrove;
- associato a un piccolo carrier o adattatore per un breakout commerciale esistente.

Separare Connector e Interface Module permette di cambiare connettore o pinout senza
riprogettare l'intera interfaccia e di riutilizzare sensori già disponibili.

### External Device

È il sensore, attuatore, display o dispositivo commerciale esterno a SpaghettiLAB. Può
essere montato vicino alla Backbone oppure remoto tramite cavo.

Non deve necessariamente essere progettato da SpaghettiLAB. Il sistema gli fornisce
il Connector e l'Interface Module adatti.

### Power Module

Un Power Module occupa una Power Bay e realizza uno stadio del Power Flow. Riceve
l'alimentazione dallo stadio precedente o dall'ingresso del sistema e può produrre una
o più uscite utilizzabili dallo stadio seguente o distribuite come rail.

Sono previste più varianti di Power Module. Per esempio, potranno esistere moduli con
ingressi o conversioni differenti. Un convertitore da rete verso una bassa tensione è
una possibile variante, non l'unica definizione del Power Module.

Questo documento non definisce isolamento, distanze, protezioni o idoneità per la rete
elettrica. Tali aspetti devono essere specificati e verificati per ogni Power Module
che gestisce tensioni pericolose.

## Struttura fisica di riferimento

Una composizione completa può essere letta così:

```text
External Device
      │
  Connector
      │
Interface Module IN
      │
 Function Bay / Input Flow
      │
 Core Bay / Core ←──── Link bus (LINK1..3) ────→ Link Bay / Link Module
      │                                            (USB-C, RS-232, ETH, Wi-Fi, BLE)
 Function Bay / Output Flow
      │
Interface Module OUT
      │
  Connector
      │
External Device

Power Input → Power Bay(s) → rail distribuite alle Function Bay e alle Link Bay
```

La rappresentazione mostra le responsabilità, non la disposizione geometrica
definitiva. Il Power Flow può essere collocato sulla stessa Backbone compatta senza
essere elettricamente confuso con Input Flow, Output Flow o Link bus. Una Backbone
può avere più Core Bay; il Link bus le collega fra loro e alle Link Bay.

## Composizioni minime previste

### Nodo di solo ingresso

```text
Power subsystem + Connector → Interface Module → Core
```

Serve per acquisire un sensore o un dispositivo esterno e rendere disponibili i suoi
dati.

### Nodo di sola uscita

```text
Power subsystem + Core → Interface Module → Connector
```

Serve per comandare o aggiornare un dispositivo esterno, per esempio un display o un
attuatore compatibile.

### Nodo completo

```text
Connector → Interface Module IN → Core → Interface Module OUT → Connector
                                ↑
                         Power subsystem
```

Acquisisce dal lato input e comanda dal lato output. Non è necessario che le due
funzioni siano correlate localmente: possono essere configurate separatamente.

### Sistema distribuito

Backbone diverse costituiscono nodi autonomi. I Core su Backbone **diverse** comunicano
attraverso il livello software (BLE, Wi‑Fi, MQTT, Node‑RED); non è obbligatorio un
cavo fra due Backbone.

Più Core sulla **stessa** Backbone comunicano sul Link bus. React Flow assegna master,
slave e protocollo quando rileva o quando l'utente inserisce un secondo Core. Non è un
ruolo saldato sul PCB.

## Contratto logico del Bay Interconnect

### Contratto di lavoro attuale

Ogni Function Bay è pensata con due gruppi logici distinti da cinque contatti del Bay
Interconnect. I gruppi descrivono continuità e funzione, non una forma di connettore.

#### Lato campo e alimentazione

```text
GND · VCC · FIELD1 · FIELD2 · FIELD3
```

- `GND` è per ora la massa comune del sistema;
- `VCC` è l'alimentazione selezionata per quella Bay;
- `FIELD1..3` sono tre segnali disponibili verso Connector ed External Device;
- il significato elettrico dei tre segnali dipende dall'Interface Module.

#### Lato Core

```text
CORE1 · CORE2 · CORE3 · CORE4 · CORE5
```

I cinque segnali collegano l'Interface Module alla terminazione del Flow sul Core. Non
hanno un significato universale fissato in questo documento: una variante di Core e il
relativo Interface Module possono usarli per bus o funzioni differenti, purché la
combinazione sia dichiarata compatibile.

Lo stesso schema logico vale sui Flow di ingresso e di uscita; cambia la direzione
rispetto al Core, non il significato dei nomi `FIELD` e `CORE`.

### Selezione dell'alimentazione della Bay

Accanto a ogni Function Bay è previsto un selettore manuale, inizialmente un ponticello,
che sceglie quale rail disponibile viene collegata al contatto `VCC` della Bay.

Le condizioni attualmente confermate sono:

- `GND` è comune;
- una Bay seleziona una delle rail rese disponibili dal Power Flow;
- la rail scelta alimenta anche l'Interface Module del lato di uscita quando quella Bay
  la seleziona;
- nella versione passiva il firmware può conoscere le rail disponibili, ma non può
  necessariamente leggere la posizione reale del ponticello.

La selezione manuale deve quindi essere considerata non verificata dal sistema finché
non esisterà una variante hardware capace di controllarla o misurarla.

### Aspetti intenzionalmente non congelati

Il contratto `5 + 5` è il punto di partenza per prototipazione, non un vincolo
irreversibile. Le revisioni future possono prevedere:

- più contatti;
- ordine differente dei contatti;
- connettori invertibili o polarizzati diversamente;
- separazione differente fra power e segnali;
- massa non completamente comune, se richiesta da isolamento o altre funzioni;
- selezione rail controllata anziché manuale.

La scelta fra pogo pin, contatti magnetici o altri sistemi non richiede di cambiare il
contratto logico quando numero, ordine e comportamento dei contatti restano identici.
Richiede invece una nuova revisione meccanica quando cambiano accoppiamento,
orientamento, tolleranze o ritenzione.

Una modifica deve produrre una nuova revisione dichiarata del contratto meccanico ed
elettrico. Non deve rendere apparentemente compatibili moduli che in realtà usano
pinout diversi.

## Link bus, Core Bay e Link Bay

Estensione della Backbone, non un cambio del firmware Core V1. I radio sul micro
restano. Il Link bus usa **tre GPIO che sul Core avanzano**, quelli che il sistema
minimo non sta utilizzando, e li porta in parallelo a tutte le Core Bay e Link Bay
della stessa Backbone.

### Benchmark: ESP32-C3 bare minimum

Core V1 ESP32-C3 è il riferimento del nodo più piccolo. Su quella board:

- GPIO3 e GPIO4 restano Port 0 (I2C di campo) e, in manutenzione, UART locale — **non
  sono spare** e **non** vanno sulla Link Bay;
- USB Serial/JTAG resta sul micro;
- flash e strapping restano riservati.

I tre pin `LINK1..3` sono gli altri GPIO ancora liberi su quel minimo. Se sul C3 non
ce ne sono tre usabili, la Link Bay non entra nel sistema minimo: resta un'estensione
per Backbone/Core che dichiarano gli spare. Varianti più grandi (più SRAM, più GPIO)
si misurano comunque contro questo pavimento: il minimo deve continuare a stare in
piedi senza Link Bay.

### Scelta di progetto

Il Link bus **non** è il Maintenance Link della Port 0 e **non** è `CORE1..5` del
Function Flow. È un terzo gruppo di contatti del connettore Core Bay, alimentato
dalle stesse power lane delle Function Bay.

Un Link Module USB‑C o RS‑232 può offrire manutenzione cablata **in baia**, usando
proprio questi spare (UART sui GPIO liberi). È un percorso in più rispetto a USB
Serial/JTAG e rispetto a GPIO3/GPIO4. Lo stesso bus, quando React Flow rileva un
secondo Core, diventa il collegamento fra Core.

Questa estensione **non** riassegna GPIO3/GPIO4 nel firmware. Finché una board non
dichiara tre GPIO spare nel DTS, la Link Bay può esistere in meccanica ma il
firmware del minimo non la guida.

### Contratto logico (punto di partenza, non pinout di produzione)

Ogni Core Bay e ogni Link Bay vede gli stessi tre segnali più alimentazione presa
dalle power lane, con lo stesso selettore `VCC` delle Function Bay:

```text
GND · VCC · LINK1 · LINK2 · LINK3
```

| Contatto | Ruolo logico | Note |
|---|---|---|
| `GND` | massa comune | la stessa del resto della Backbone |
| `VCC` | rail scelta in baia | identica alle Function Bay; Ethernet/Wi‑Fi devono dichiarare corrente, la UI rifiuta una rail insufficiente |
| `LINK1` | UART A | TX del Core sul bus spare, non GPIO3 |
| `LINK2` | UART B | RX del Core sul bus spare, non GPIO4 |
| `LINK3` | ATTN | open‑drain: presenza modulo, richiesta attenzione, wake. Non è alimentazione |

I tre `LINK` sono un bus parallelo: tutte le Core Bay e le Link Bay di una Backbone
sono sullo stesso net. Non è una daisy‑chain punto‑punto. All'accensione ogni Core
tiene `LINK1`/`LINK2` in alta impedenza con pull‑up; nessuno guida il bus finché la
Config (scelta in React Flow) non assegna un ruolo.

### Chi decide master, slave e protocollo

Il PCB non ha un master. React Flow, quando rileva o quando l'utente inserisce un
secondo Core sulla stessa Backbone, chiede:

- quale Core è master del Link bus;
- quale protocollo usare su quel bus;
- che fare di un eventuale Link Module USB‑C/RS‑232 già inserito (console sul master,
  oppure rilasciare il bus).

Un solo Core alla volta guida `LINK1`/`LINK2`. Gli altri restano in ascolto. Cambiare
ruolo è un deploy di Config, non un ponticello.

### Modi d'uso previsti

**Un Core, Link Module USB‑C (blocco consigliato per primo) o RS‑232.** Full‑duplex
su `LINK1`/`LINK2`, `LINK3` segnala presenza. Manutenzione in baia sui GPIO spare,
non al posto di GPIO3/GPIO4. USB‑C porta un ponte USB‑UART sul modulo; RS‑232 porta
il transceiver di livello. Il Core vede UART su pin che il minimo non usava. CC/PD e
RS‑232 restano sul modulo.

**Due o più Core, senza dongle.** Il master eletto parla con gli slave. Il payload è
lo stesso Protocol V1 CBOR; sul filo c'è solo un involucro corto (indirizzo di slot,
lunghezza, CRC). Non si inventa un secondo modello applicativo.

**Link Module Wi‑Fi, Ethernet o Bluetooth.** Coprocessore sullo stesso UART. Non è il
PHY nativo (RMII, SDIO, USB device) sui tre pin. Il Core pubblica record scegliendo
l'interfaccia in React Flow: radio sul micro, oppure questo modulo. Le due cose
possono coesistere.

USB‑C/RS‑232 e un secondo Core sullo stesso bus pieno‑duplex collidono se entrambi
guidano TX. La UI non consente quella combinazione senza aver eletto un master e
aver messo il dongle in ascolto sul master.

### Cosa non è

- Non è una Function Bay: niente Connector di campo su questi tre pin.
- Non sostituisce USB Serial/JTAG sul modulo Core: il recovery cablato sul micro resta.
- Non toglie Wi‑Fi o Bluetooth dal firmware V1.
- Non usa `FIELD1..3`, né `CORE1..5`, né GPIO3/GPIO4 (Port 0 / Maintenance Link del minimo).
- Non è obbligatoria sul bare minimum: il C3 deve funzionare senza Link Bay.

## Distribuzione Power

Il Power Flow è separato dai Function Flow ma serve l'intera composizione.

```text
Power input
    │
Power Bay 0 / stage 0
    │ output verso lo stage successivo
Power Bay 1 / stage 1
    │
    ├── rail A ──┬── selector Function Bay IN
    │            ├── selector Function Bay OUT
    │            └── selector Link Bay
    │
    └── rail B ── stessi possibili utilizzatori
```

Il disegno non congela il numero delle rail, degli stadi o il modo in cui il Core viene
alimentato. Fissa invece questi principi:

1. i Power Module possono essere concatenati per stadi;
2. ogni stadio riceve dal Power Flow e può passare un'uscita allo stadio successivo;
3. le uscite dichiarate come rail vengono distribuite dalla Backbone;
4. ogni Function Bay e ogni Link Bay sceglie localmente la rail destinata al proprio `VCC`;
5. la disponibilità di una rail non implica automaticamente che tensione e corrente
   siano adatte al modulo inserito;
6. una futura Backbone controllata può verificare o commutare la selezione, mentre una
   Backbone passiva resta manuale.

## Come si usa il sistema

Per collegare un nuovo dispositivo esterno si procede concettualmente così:

1. si sceglie una Compact Backbone con le posizioni necessarie;
2. si inserisce un Core compatibile;
3. si compone il Power Flow con i Power Module necessari;
4. si verifica quali rail risultano disponibili;
5. si sceglie un Interface Module adatto all'interfaccia elettrica del dispositivo;
6. lo si colloca nella Function Bay corretta rispetto alla direzione del Flow;
7. si seleziona manualmente la rail della Bay nella revisione passiva;
8. si collega il dispositivo tramite il Connector adatto;
9. il software associa Bay, interfaccia, dispositivo e label;
10. il Core configura e usa i segnali previsti dalla combinazione compatibile.

Per aggiungere manutenzione cablata o una radio/porta host extra: si inserisce un
Link Module nella Link Bay, si sceglie la rail, e in React Flow si seleziona
l'interfaccia di pubblicazione. Per un secondo Core sulla stessa Backbone: si inserisce
nella Core Bay libera; React Flow chiede master, slave e protocollo sul Link bus.

Per un sensore supportato da un'interfaccia generica non è necessario creare un nuovo
Interface Module: possono bastare un Connector/adattatore e un profilo software del
dispositivo.

## Naming e regole d'uso

I nomi canonici devono essere usati con questo significato:

| Termine | Indica | Non indica |
|---|---|---|
| Backbone | Base e distribuzione passiva della composizione | Un sensore o il Core |
| Core | Calcolo, comunicazione e terminazione dei Flow | L'intera composizione |
| Core Bay | Posizione Backbone che riceve un Core | Una Function Bay o una radio |
| Link bus | Tre GPIO **spare** del Core (quelli che il minimo non usa), comuni a Core Bay e Link Bay | GPIO3/GPIO4, Port di campo, `CORE1..5`, USB del micro |
| Link Bay | Posizione Backbone per un Link Module | Una Function Bay verso il campo |
| Link Module | USB‑C, RS‑232, Ethernet, Wi‑Fi, Bluetooth o analoghi verso host/rete | Un Interface Module di campo |
| Flow | Percorso fisico ordinato di segnali o power | Un singolo pin o una schermata software |
| Bay | Posizione fisica ordinata | Il protocollo o il dispositivo collegato |
| Module | Elemento funzionale sostituibile inserito in una Bay | Il Core, il Connector o l'External Device |
| Bay Interconnect | Contatti e accoppiamento fra Backbone e Module | Il connettore del sensore esterno |
| Interface Module | Adattamento elettrico riusabile verso il campo | Un dongle USB o una radio host |
| Connector | Terminazione/pinout/cavo verso il campo | L'adattamento elettrico completo |
| External Device | Sensore, attuatore o display esterno | Un modulo SpaghettiLAB obbligatorio |
| Power Module | Uno stadio del Power Flow | L'intero sistema di alimentazione in ogni caso |
| Rail | Uscita di alimentazione distribuita e selezionabile | Una garanzia implicita di compatibilità |

Per evitare ambiguità:

- Input e Output sono sempre riferiti al Core;
- una Bay viene identificata anche dal Flow cui appartiene;
- una rail disponibile non è automaticamente una rail verificata;
- un Module è un elemento inserito nel sistema, mentre l'External Device può essere un
  prodotto di terze parti collegato tramite Connector;
- il nome commerciale di un sensore non deve diventare il nome dell'Interface Module
  quando l'interfaccia è riusabile;
- un Link Module non si chiama Interface Module;
- master/slave del Link bus è Config, non serigrafia sul PCB.

## Compatibilità fra elementi

La compatibilità completa richiede contemporaneamente:

- revisione meccanica compatibile;
- revisione e pinout dei connettori compatibili;
- Flow e direzione compatibili;
- segnali del Core compatibili con l'Interface Module;
- ruoli Link bus assegnati in Config se c'è più di un Core;
- rail selezionata compatibile con il modulo e con l'External Device;
- Connector e pinout esterno corretti;
- configurazione software coerente.

La sola possibilità di inserire fisicamente un modulo non deve essere considerata prova
di compatibilità elettrica.

## Decisioni ancora aperte

Le seguenti scelte devono rimanere aperte fino ai prototipi e alle verifiche:

- forma, passo, polarizzazione e ritenzione dei connettori;
- tecnologia del Bay Interconnect, inclusi eventuali pogo pin e magneti;
- possibilità concreta di rendere il collegamento invertibile;
- conferma che `5 + 5` contatti siano sufficienti;
- pinout definitivo di entrambe le metà della Function Bay;
- numero e caratteristiche delle rail;
- modalità di alimentazione diretta del Core;
- numero massimo e ordine dei Power Stage;
- separazione, isolamento e comportamento delle masse;
- limiti elettrici e meccanismi di protezione;
- possibilità di rilevare presenza, tipo o orientamento dei moduli;
- dimensioni della Compact Backbone e numero di Bay delle varianti;
- meccanismo di fissaggio e gestione ordinata dei cavi esterni;
- quale terna GPIO **spare** di ogni variante Core finisce su `LINK1..3` (sul C3:
  solo pin non usati da Port 0, USB, flash, strapping; il minimo può omettere la
  terna);
- baud e involucro esatto del link multi‑Core (il payload resta Protocol V1);
- primo Link Module da prototipare: USB‑C UART è la scelta di progetto; RS‑232 e
  Ethernet/Wi‑Fi/BLE sono la stessa baia, PHY diversi.

Queste voci non impediscono di usare l'architettura generale. Impediscono invece di
trattare il primo pinout o la prima meccanica come uno standard definitivo prima di
averli provati.

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

Questa revisione evolve l'architettura precedente: la Backbone non è più un PCB unico
con un numero predefinito di Bay. L'unità fisica elementare è la Bay; la Backbone è
la struttura ottenuta collegandone una o più.

## Idea generale

SpaghettiLAB è un sistema componibile nel quale **Bay identiche** si collegano fra
loro per formare una **Backbone**. Sulle Bay si montano **Module**: un **Core**,
**Interface Module** di campo, eventuali Module verso host e rete, **Power Module** e,
in futuro, Module di routing. I **Connector** e gli **External Device** restano sul
lato campo.

Il sistema non richiede un modulo hardware diverso per ogni sensore commerciale. Un
sensore o attuatore esterno viene collegato attraverso:

```text
External Device → Connector → Interface Module → Bay → … → Core
```

Per un'uscita il percorso logico è opposto:

```text
Core → … → Bay → Interface Module → Connector → External Device
```

La direzione (ingresso o uscita rispetto al Core) deriva dalla composizione e dal
Flow, non da un lato fisso della Bay.

L'Interface Module è specifico dell'interfaccia elettrica, non necessariamente del
dispositivo finale. La stessa interfaccia può quindi servire molti dispositivi diversi.
Esempi di famiglie possibili sono I2C, SPI, UART, RS-232, RS-485, ingresso analogico,
ingresso optoisolato e uscita pilotata. L'elenco non definisce quali moduli siano già
progettati o disponibili.

La Bay è passiva, economica e ripetibile. La funzione sta nel Module. Sistemi diversi
si ottengono principalmente con il numero di Bay, la loro disposizione e i Module
installati, non con famiglie di PCB Backbone da 2, 4 o 8 slot.

La modularità deve funzionare anche con composizioni molto piccole: un nodo può essere
una sola Bay con Core e alimentazione, e trovare posto dentro un prodotto, una scatola
tecnica o un altro volume ristretto. Questa è un'intenzione di formato, non una
dichiarazione di idoneità normativa per installazioni a tensione di rete.

## Terminologia canonica

### System

Una composizione completa e funzionante formata da almeno una Backbone (una o più Bay),
un Core e una sorgente di alimentazione, alla quale possono essere aggiunti Interface
Module, Connector ed External Device.

### Bay

La Bay è l'unità fisica elementare. È un elemento passivo, identico alle altre Bay,
indipendente dalla funzione del Module montato sopra.

Una Bay:

- riceve un Module sul lato TOP;
- si collega ad altre Bay sui lati FRONT, REAR, LEFT e RIGHT;
- fa transitare il Function Flow e le Power Lane;
- consente al Module di inserirsi nel percorso dei segnali;
- seleziona localmente quale Power Lane diventa `VCC` sul Bay Link.

Non esistono, salvo necessità dimostrata in prototipo, Bay fisicamente specializzate
per Core, Interface Module o Power Module. La stessa Bay serve tutti i Module
elettricamente compatibili.

«Function Bay», «Core Bay», «Link Bay» e «Power Bay» non sono tipi di PCB. Possono
descrivere, al massimo, il **ruolo** di una Bay in una composizione (quale Module la
occupa). Il firmware usa ancora «Function Bay» per la posizione ordinata lungo un Flow
come la vede il Core: è una vista logica di occupazione, non una Bay hardware diversa.

### Backbone

La Backbone è la struttura ottenuta collegando una o più Bay compatibili. Non è
necessariamente un singolo PCB con N posizioni predefinite.

```text
1 Bay:    [BAY]

4 Bay:    [BAY] — [BAY] — [BAY] — [BAY]
```

La Backbone:

- mantiene l'ordine e la posizione dei moduli nella composizione;
- realizza i collegamenti Bay–Bay (Function Flow, Power Lane, Bay Link);
- distribuisce massa e le alimentazioni disponibili;
- rende la composizione estendibile aggiungendo Bay, senza scegliere un modello di
  scheda da 2, 4 o 8 slot.

La lunghezza e la topologia nascono dalla composizione. Una famiglia meccanica resta
necessaria (passo, accoppiamento, ritenzione), ma non implica un PCB Backbone
monolitico.

### Core

Il Core è l'elemento di calcolo e comunicazione del sistema. Termina i Flow funzionali,
configura e utilizza le interfacce disponibili e comunica con il software esterno.

Il Core occupa una Bay come gli altri Module. Non richiede una posizione fisica
dedicata nella Backbone. Resta comunque **Core**: non diventa un termine generico per
qualunque modulo. Connector ed External Device non vengono chiamati Module; il Core
mantiene il nome Core perché ha il ruolo specifico di elaborazione e terminazione dei
Flow.

Il Core non deve contenere fisicamente ogni possibile interfaccia per sensori e
attuatori. Queste funzioni appartengono agli Interface Module. Radio e USB sul modulo
Core restano valide: Wi‑Fi e/o Bluetooth sul micro **non vengono rimossi**. Un Module
verso host o rete è un'interfaccia **in più**, non un sostituto. Togliere radio da un
micro con poca RAM è una decisione futura di variante Core, non un requisito di questa
architettura.

Un Core può avere almeno:

- un Flow orientato dal campo verso il Core;
- un Flow orientato dal Core verso il campo;
- il collegamento alle Power Lane della Backbone;
- se avanzano sul micro, GPIO spare utilizzabili dal Module Core verso il Bay Link
  (non richiesti dal bare minimum).

L'ESP32-C3 è la board **bare minimum**: benchmark di RAM, flash, radio e pin per il
nodo più piccolo. Port di campo, USB Serial/JTAG e pin di strapping/flash restano
quelli del minimo. Eventuali segnali verso il Bay Link si prendono solo da ciò che su
quel micro **avanza**. Una variante più ricca può esporre gli stessi ruoli su GPIO
diversi; non può pretendere pin che sul C3 minimo sono già occupati.

GPIO3 e GPIO4 restano Port 0 (I2C di campo) e, in manutenzione, UART locale: **non
sono spare** e **non** vanno riassegnati al Bay Link. USB Serial/JTAG, flash e
strapping restano riservati. Finché una board non dichiara GPIO spare nel DTS, il
firmware del minimo non guida il Bay Link.

Varianti future del Core possono esporre un numero diverso di Flow, senza cambiare il
significato dei termini.

### Flow

Un Flow è un percorso fisico ordinato di segnali attraverso la composizione. Descrive
come le Bay collegate formano un cammino dal campo al Core o dal Core al campo; non è
un singolo filo e non coincide con una Bay.

Sono distinti due ruoli.

#### Function Flow

Trasporta i segnali funzionali fra un External Device e il Core attraverso Connector e
Interface Module, attraversando le Bay.

Un Function Flow può essere:

- **Input Flow**, orientato dal campo verso il Core;
- **Output Flow**, orientato dal Core verso il campo;
- in futuro bidirezionale, se hardware e interfaccia lo richiederanno.

Le parole input e output sono sempre riferite al Core. FRONT e REAR della Bay **non**
sono input e output permanenti: i due lati sono pass-through intercambiabili. La
direzione si legge dalla composizione (dove sta il Core, dove sta il campo).

Le cinque linee del Function Flow attraversano la Bay e possono essere
intercettate o elaborate dal Module attraverso MODULE IN e MODULE OUT.

#### Power Flow

È il percorso degli stadi di alimentazione. Non richiede Bay dedicate. Un Power Module
usa la stessa Bay degli altri Module, si collega alle Power Lane e immette la propria
uscita nella lane selezionata.

Esempio puramente funzionale:

```text
Power Input → Power Module / stadio 1 → Power Module / stadio 2 → Power Lane
```

Questo consente di comporre alimentazioni con più trasformazioni successive. Un
Power Module AC che riduce o converte una tensione è un possibile esempio, non un
pinout o circuito già congelato.

Le uscite utili prodotte dai Power Module diventano Power Lane propagate attraverso le
altre Bay. Una Bay qualsiasi può selezionare quella lane per il proprio `VCC`.

### Module

Module è il termine generale per un elemento funzionale sostituibile inserito in una
Bay. In questa architettura le categorie concettuali principali restano distinte:

- **Core**, elaborazione e comunicazione;
- **Interface Module**, verso il campo (I2C, UART, GPIO, …);
- **Link Module**, verso host o rete (USB‑C, RS‑232, Ethernet, Wi‑Fi, Bluetooth, …);
- **Power Module**, stadio di alimentazione;
- in futuro **Routing Module**, che può occupare più Bay.

Tutti, quando elettricamente compatibili, usano la stessa Bay. Un Link Module non è un
Interface Module: il primo parla con host o con altri Core, il secondo con il campo.

### Interface Module

Un Interface Module occupa una Bay e realizza il confine elettrico fra il Core e il
dispositivo esterno.

Può svolgere una o più delle seguenti funzioni:

- adattamento di livello o formato elettrico;
- protezione;
- isolamento, quando previsto dal modulo specifico;
- conversione fra i segnali del Core e un bus o ingresso/uscita esterno;
- esposizione dei segnali richiesti al Connector.

Un Interface Module rappresenta una capacità elettrica riusabile. Non rappresenta
necessariamente uno specifico sensore. Il comportamento del dispositivo collegato può
essere descritto separatamente dal software e dal firmware.

La forma meccanica dei moduli può essere comune. La reversibilità fisica non implica
reversibilità elettrica: un ingresso optoisolato e un'uscita pilotata, per esempio,
restano funzioni differenti.

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

Un Power Module occupa una Bay universale e realizza uno stadio del Power Flow. Riceve
l'alimentazione dallo stadio precedente o dall'ingresso del sistema e può produrre una
o più uscite immesse nella Power Lane selezionata su quella Bay.

```text
Power Module
     │
    BAY
     │
     └──► Power Lane B  ──►  propagate along chained Bays
```

Una Bay con un Interface Module può selezionare la stessa Power Lane B per ottenere
`VCC`.

Sono previste più varianti di Power Module. Per esempio, potranno esistere moduli con
ingressi o conversioni differenti. Un convertitore da rete verso una bassa tensione è
una possibile variante, non l'unica definizione del Power Module.

Questo documento non definisce isolamento, distanze, protezioni o idoneità per la rete
elettrica. Tali aspetti devono essere specificati e verificati per ogni Power Module
che gestisce tensioni pericolose.

### Routing Module

Possibilità architetturale futura, non hardware già definito.

Un Routing o Splitter Module potrà occupare più Bay, prendere uno o più segnali da un
Function Flow, mantenerne il pass-through e portarli anche al Bay Link o a una Bay
adiacente. Serve a costruire topologie più complesse senza Backbone specializzate.
Finché non esiste un prototipo, non si assegnano pinout, meccanica a cavallo di più
Bay, né regole di collisione sul bus.

## Interfacce fisiche della Bay

Contratto di lavoro per prototipazione, non congelato per produzione. Per il prototipo
i contatti possono essere pin header 2,54 mm. Pogo pin, magneti o altre tecnologie
restano implementazioni future possibili: il contratto logico è indipendente dalla
tecnologia del connettore.

```text
                    TOP  (Module)
         MODULE IN (5) · MODULE OUT (5) · POWER LANES (4)
                              │
     LEFT                     │                    RIGHT
  Bay Link (5) ────────────  BAY  ──────────── Bay Link (5)
  S1 S2 S3 VCC GND            │              S1 S2 S3 VCC GND
                              │
                    FRONT / REAR
         Function Flow (5) · Power Lane (4)
         (pass-through, lati intercambiabili)
```

### TOP — collegamento al Module

La Bay espone:

- **MODULE IN**: 5 pin;
- **MODULE OUT**: 5 pin;
- **POWER LANES**: 4 pin.

MODULE IN e MODULE OUT permettono al Module di inserirsi nel percorso dei segnali del
Function Flow. Le quattro Power Lane sono le rail disponibili lungo la composizione.
Sulla Bay è presente un sistema di selezione della Power Lane.

Questo documento non assegna un nome elettrico permanente ai singoli pin oltre questi
gruppi.

### FRONT / REAR

La Bay espone anteriormente e posteriormente:

- 5 pin Function Flow;
- 4 pin Power Lane.

FRONT e REAR sono pass-through e concettualmente intercambiabili. Non hanno un
significato elettrico permanente di input o output. Il significato della direzione
deriva dalla composizione e dal Flow.

Le cinque linee Function Flow attraversano la Bay e possono essere intercettate dal
Module tramite MODULE IN / MODULE OUT. Le quattro Power Lane attraversano la Bay e
distribuiscono le alimentazioni lungo la catena.

### LEFT / RIGHT — Bay Link

Entrambi i lati espongono lo stesso Bay Link a 5 pin:

```text
SIGNAL 1 · SIGNAL 2 · SIGNAL 3 · VCC · GND
```

LEFT e RIGHT sono equivalenti e intercambiabili. `VCC` è la Power Lane selezionata
localmente da quella Bay. `GND` è, per ora, la massa comune.

Il Bay Link permette a Bay adiacenti, o a Module che occupano o collegano più Bay, di
condividere tre segnali, l'alimentazione selezionata e la massa.

Il Bay Link **non** è il Maintenance Link della Port 0 e **non** è il Function Flow.
Non usa GPIO3/GPIO4. Non è un bus parallelo saldato su un PCB Backbone dedicato: è
l'interfaccia laterale di ogni Bay. Come i tre segnali vengano usati (secondo Core,
Link Module, routing futuro) è Config e Module, non serigrafia.

## Bay Interconnect

Il Bay Interconnect è l'insieme dei contatti e dell'accoppiamento meccanico della Bay.
È distinto dal Connector rivolto all'External Device.

Comprende quattro rapporti, da non confondere:

1. **Bay ↔ Module** (TOP: MODULE IN, MODULE OUT, POWER LANES);
2. **Bay ↔ Bay FRONT/REAR** (Function Flow e Power Lane, pass-through);
3. **Bay ↔ Bay LEFT/RIGHT** (Bay Link);
4. **distribuzione delle Power Lane** (attraversamento FRONT/REAR e selezione locale
   verso `VCC` del Bay Link e verso il Module).

Il contratto architetturale definisce i gruppi e il loro ruolo, non la tecnologia. Il
prototipo può usare header 2,54 mm. Revisioni successive potranno usare contatti a
molla, pogo pin, accoppiamento magnetico, connettori polarizzati o un'altra soluzione
adatta, senza cambiare il contratto logico se numero, ordine e comportamento dei
contatti restano identici.

Un eventuale magnete appartiene al sistema meccanico di allineamento e ritenzione; non
modifica da solo direzione, pinout o compatibilità elettrica. La possibilità di
accoppiare fisicamente due parti non deve rendere compatibili revisioni elettriche
diverse.

Una modifica deve produrre una nuova revisione dichiarata del contratto meccanico ed
elettrico.

### Selezione dell'alimentazione della Bay

Ogni Bay ha un selettore, inizialmente pensato come ponticello, che sceglie quale
delle Power Lane disponibili diventa `VCC` su quella Bay.

Le condizioni attualmente confermate come principi, non come valori elettrici, sono:

- `GND` è comune, finché isolamento o altre funzioni non richiedano diversamente;
- una Bay seleziona una delle Power Lane;
- la lane scelta alimenta il Bay Link (`VCC`) e, attraverso TOP, il Module quando
  quella Bay la seleziona;
- nella versione passiva il firmware può conoscere le rail dichiarate dalla board, ma
  non può necessariamente leggere la posizione reale del selettore.

La selezione manuale deve quindi essere considerata non verificata dal sistema finché
non esisterà una variante hardware capace di controllarla o misurarla.

Le quattro Power Lane e il selettore sono un contratto di prototipazione. Questo
documento non fissa tensioni, correnti, protezioni, isolamento, né il numero
definitivo di rail.

## Struttura fisica di riferimento

Una composizione completa può essere letta così:

```text
External Device
      │
  Connector
      │
Interface Module
      │
     BAY ──── Bay Link ──── BAY ──── Bay Link ──── BAY
      │                      │                      │
 Function Flow         Core / Module          Interface Module
 (direzione dal        (termina i Flow)            │
  campo o dal Core,                           Connector
  non da FRONT/REAR)                               │
                                            External Device

Power Module su una Bay qualsiasi ──► Power Lane selezionata ──► altre Bay
```

La rappresentazione mostra le responsabilità, non la disposizione geometrica
definitiva. Function Flow e Power Lane convivono sulla stessa catena di Bay senza
essere elettricamente lo stesso gruppo di pin. Più Core sulla stessa Backbone
occupano Bay universali e, se devono parlarsi in hardware, usano il Bay Link o un
Routing Module futuro. React Flow può assegnare ruoli (master/slave, protocollo)
quando rileva o quando l'utente inserisce un secondo Core: non è un ruolo saldato sul
PCB.

## Composizioni minime previste

### Nodo di solo ingresso

```text
[BAY: Power Module] — [BAY: Interface Module] — [BAY: Core]
```

Serve per acquisire un sensore o un dispositivo esterno e rendere disponibili i suoi
dati. Tre Bay sono un esempio, non un minimo obbligatorio: Power e Interface possono
stare su Bay distinte o, se un Module futuro lo consente, combinazioni diverse.
L'ingresso è verso il Core, non «il lato FRONT».

### Nodo di sola uscita

```text
[BAY: Power Module] — [BAY: Core] — [BAY: Interface Module]
```

Serve per comandare o aggiornare un dispositivo esterno, per esempio un display o un
attuatore compatibile.

### Nodo completo

```text
[BAY: Interface IN] — [BAY: Core] — [BAY: Interface OUT]
         ↑
   [BAY: Power Module]  (stessa catena, Power Lane condivisa)
```

Acquisisce dal lato input e comanda dal lato output. Non è necessario che le due
funzioni siano correlate localmente: possono essere configurate separatamente.

### Sistema distribuito

Backbone diverse (catene di Bay non collegate fra loro) costituiscono nodi autonomi.
I Core su Backbone **diverse** comunicano attraverso il livello software (BLE, Wi‑Fi,
MQTT, Node‑RED); non è obbligatorio un cavo fra due Backbone.

Più Core sulla **stessa** Backbone comunicano, se serve il filo, attraverso il Bay
Link o, in futuro, un Routing Module. React Flow assegna master, slave e protocollo
quando rileva o quando l'utente inserisce un secondo Core.

## Link Module e GPIO spare del Core

Un Link Module (USB‑C, RS‑232, Ethernet, Wi‑Fi, Bluetooth, …) occupa una Bay
universale. Non è una Bay diversa e non è un Interface Module di campo.

I tre segnali del Bay Link sono il contratto laterale della Bay, non un pinout UART
già scelto. Un Core con GPIO spare può portarli sul Bay Link tramite il proprio
Module; il C3 minimo può omettere quel collegamento e continuare a funzionare.

**Cosa non è il Bay Link**

- Non è un Connector di campo.
- Non sostituisce USB Serial/JTAG sul modulo Core.
- Non toglie Wi‑Fi o Bluetooth dal firmware V1.
- Non è GPIO3/GPIO4 (Port 0 / Maintenance Link del minimo).
- Non è obbligatorio sul bare minimum: il C3 deve funzionare anche con una sola Bay e
  senza secondi Core.

USB‑C/RS‑232 e un secondo Core che guidano entrambi lo stesso SIGNAL in full-duplex
collidono. La UI non deve consentire quella combinazione senza aver eletto un ruolo e
aver messo i driver in ascolto dove serve. Il payload, se si usa un link multi-Core,
resta Protocol V1 CBOR; non si inventa un secondo modello applicativo.

## Distribuzione Power

Il Power Flow è concettualmente distinto dal Function Flow ma vive sulla stessa catena
di Bay.

```text
Power input
    │
Power Module su una Bay  ──►  Power Lane B
    │
    ├── altre Bay (pass-through delle 4 lane)
    │
    └── selettore locale ──► VCC di quella Bay (Module e Bay Link)
```

Principi:

1. i Power Module possono essere concatenati per stadi, ciascuno su una Bay
   universale;
2. ogni stadio può immettere un'uscita nella Power Lane selezionata;
3. le Power Lane si propagano FRONT/REAR lungo la catena;
4. ogni Bay sceglie localmente la lane destinata al proprio `VCC`;
5. la disponibilità di una lane non implica che tensione e corrente siano adatte al
   Module inserito;
6. una futura Bay o un futuro Module controllati possono verificare o commutare la
   selezione; la Bay passiva resta manuale.

## Come si usa il sistema

Per collegare un nuovo dispositivo esterno si procede concettualmente così:

1. si compone la Backbone con il numero di Bay necessario;
2. si inserisce un Core compatibile su una Bay;
3. si inserisce un Power Module su una Bay e si seleziona la Power Lane di uscita;
4. si verifica quali lane risultano disponibili lungo la catena;
5. si sceglie un Interface Module adatto all'interfaccia elettrica del dispositivo;
6. lo si colloca su una Bay nella posizione di Flow corretta rispetto al Core;
7. si seleziona manualmente la Power Lane di quella Bay nella revisione passiva;
8. si collega il dispositivo tramite il Connector adatto;
9. il software associa Bay, interfaccia, dispositivo e label;
10. il Core configura e usa i segnali previsti dalla combinazione compatibile.

Per aggiungere manutenzione cablata o una radio/porta host extra: si inserisce un
Link Module su una Bay, si sceglie la lane, e in React Flow si seleziona
l'interfaccia di pubblicazione. Per un secondo Core sulla stessa Backbone: si
inserisce su una Bay libera; React Flow chiede i ruoli sul Bay Link se i due Core
devono parlarsi in hardware.

Per un sensore supportato da un'interfaccia generica non è necessario creare un nuovo
Interface Module: possono bastare un Connector/adattatore e un profilo software del
dispositivo.

## Naming e regole d'uso

I nomi canonici devono essere usati con questo significato:

| Termine | Indica | Non indica |
|---|---|---|
| Bay | Unità fisica passiva, identica, concatenabile | Un tipo di Module o un protocollo |
| Backbone | Catena di una o più Bay compatibili | Un PCB obbligatoriamente monolitico, un sensore o il Core |
| Core | Calcolo, comunicazione e terminazione dei Flow | L'intera composizione o una Bay speciale |
| Flow | Percorso fisico ordinato di segnali o power | Un singolo pin, un lato FRONT/REAR o una schermata software |
| Function Flow | Cinque linee di segnale che attraversano le Bay | Il Bay Link o le Power Lane |
| Power Flow | Stadi di alimentazione realizzati da Power Module | Una Bay dedicata obbligatoria |
| Power Lane | Rail che attraversa le Bay e può essere selezionata | Una garanzia di tensione/corrente |
| Bay Link | Cinque pin LEFT/RIGHT (3 segnali, VCC, GND) | Function Flow, Port 0, USB del micro |
| Module | Elemento funzionale sostituibile sul TOP della Bay | Il Connector o l'External Device |
| Bay Interconnect | Contatti e accoppiamento Bay↔Module e Bay↔Bay | Il connettore del sensore esterno |
| Interface Module | Adattamento elettrico riusabile verso il campo | Un dongle USB o una radio host |
| Link Module | USB‑C, RS‑232, Ethernet, Wi‑Fi, Bluetooth o analoghi verso host/rete | Un Interface Module di campo o una Bay diversa |
| Connector | Terminazione/pinout/cavo verso il campo | L'adattamento elettrico completo |
| External Device | Sensore, attuatore o display esterno | Un modulo SpaghettiLAB obbligatorio |
| Power Module | Uno stadio del Power Flow su una Bay universale | L'intero sistema di alimentazione in ogni caso |
| Routing Module | Possibilità futura di Module su più Bay | Hardware già definito |
| Rail | Sinonimo d'uso per una Power Lane selezionabile | Una garanzia implicita di compatibilità |

Per evitare ambiguità:

- Input e Output sono sempre riferiti al Core, mai a FRONT/REAR;
- una Bay viene identificata anche dal ruolo del Module e dal Flow cui partecipa;
- una Power Lane disponibile non è automaticamente una lane verificata;
- un Module è un elemento inserito nel sistema, mentre l'External Device può essere un
  prodotto di terze parti collegato tramite Connector;
- il nome commerciale di un sensore non deve diventare il nome dell'Interface Module
  quando l'interfaccia è riusabile;
- un Link Module non si chiama Interface Module;
- master/slave su Bay Link è Config, non serigrafia sul PCB;
- «Function Bay» nel firmware è la posizione logica lungo un Flow, non un PCB distinto.

## Compatibilità fra elementi

La compatibilità completa richiede contemporaneamente:

- revisione meccanica compatibile fra Bay adiacenti e fra Bay e Module;
- revisione e pinout dei connettori compatibili;
- Flow e direzione compatibili rispetto al Core;
- segnali del Core compatibili con l'Interface Module;
- ruoli sul Bay Link assegnati in Config se c'è più di un Core o un Link Module in
  conflitto di guida;
- Power Lane selezionata compatibile con il Module e con l'External Device;
- Connector e pinout esterno corretti;
- configurazione software coerente.

La sola possibilità di inserire fisicamente un Module su una Bay non deve essere
considerata prova di compatibilità elettrica.

## Decisioni ancora aperte

Le seguenti scelte devono rimanere aperte fino ai prototipi e alle verifiche:

- forma, passo, polarizzazione e ritenzione dei connettori, incluso l'accoppiamento
  Bay–Bay su FRONT/REAR e LEFT/RIGHT;
- tecnologia definitiva del Bay Interconnect (il prototipo può usare header 2,54 mm;
  pogo pin e magneti restano opzioni future);
- possibilità concreta di rendere il collegamento invertibile;
- conferma che 5 + 5 pin TOP, 5 + 4 FRONT/REAR e 5 pin Bay Link siano sufficienti;
- pinout definitivo all'interno di ciascun gruppo (nessun nome oltre MODULE IN/OUT,
  Function Flow, Power Lane, SIGNAL 1–3);
- numero definitivo di Power Lane (quattro è il contratto di prototipo);
- meccanismo esatto del selettore di lane;
- modalità di alimentazione diretta del Core;
- numero massimo e ordine dei Power Stage;
- separazione, isolamento e comportamento delle masse;
- limiti elettrici e meccanismi di protezione;
- possibilità di rilevare presenza, tipo o orientamento dei Module e delle Bay;
- come un Core Module mappa Port e Flow su MODULE IN/OUT e, se ci sono GPIO spare, sul
  Bay Link;
- se il Bay Link è solo adiacente o può essere prolungato con cavetti/jumper;
- meccanica di un Module che occupa più Bay (Routing Module: futuro);
- meccanismo di fissaggio e gestione ordinata dei cavi esterni;
- quale terna GPIO **spare** di ogni variante Core, se esiste, arriva al Bay Link (sul
  C3: solo pin non usati da Port 0, USB, flash, strapping; il minimo può omettere la
  terna);
- baud e involucro esatto di un eventuale link multi-Core (il payload resta Protocol
  V1);
- primo Link Module da prototipare: USB‑C UART resta una scelta di progetto; RS‑232 e
  Ethernet/Wi‑Fi/BLE sono lo stesso ruolo concettuale, PHY diversi.

Queste voci non impediscono di usare l'architettura generale. Impediscono invece di
trattare il primo pinout o la prima meccanica come uno standard definitivo prima di
averli provati.

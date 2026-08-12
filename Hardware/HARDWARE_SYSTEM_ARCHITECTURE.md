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
un **Core**, uno o più **Interface Module**, i relativi **Connector** e il sottosistema
di alimentazione.

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
- espone le posizioni previste per Core, Function Bay e Power Bay.

La prima famiglia prevista è una **Compact Backbone**, destinata sia a piccoli nodi
autonomi sia a composizioni più estese.

La lunghezza e il numero di Bay possono cambiare fra diverse Compact Backbone, purché
il contratto meccanico ed elettrico adottato dalla relativa famiglia sia compatibile
con i moduli dichiarati.

### Core

Il Core è l'elemento di calcolo e comunicazione del sistema. Termina i Flow funzionali,
configura e utilizza le interfacce disponibili e comunica con il software esterno.

Il Core non deve contenere fisicamente ogni possibile interfaccia per sensori e
attuatori. Queste funzioni appartengono agli Interface Module montati nelle Bay.

Un Core può avere almeno:

- un Flow orientato dal campo verso il Core;
- un Flow orientato dal Core verso il campo;
- il collegamento al sottosistema Power della Backbone.

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

Esistono due ruoli principali:

- **Function Bay**, per un Interface Module;
- **Power Bay**, per un Power Module appartenente al Power Flow.

La stessa forma meccanica può essere riutilizzata dove compatibile, ma questo non rende
automaticamente intercambiabili Function Module e Power Module.

### Module

Module è il termine generale per un elemento funzionale sostituibile inserito in una
Bay. In questa architettura le categorie fisiche principali sono:

- **Interface Module**, inserito in una Function Bay;
- **Power Module**, inserito in una Power Bay.

Il Core è un elemento sostituibile della composizione ma mantiene il nome Core, perché
ha il ruolo specifico di elaborazione e terminazione dei Flow. Connector ed External
Device non vengono chiamati Module.

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
     Core
      │
 Function Bay / Output Flow
      │
Interface Module OUT
      │
  Connector
      │
External Device

Power Input → Power Bay(s) → rail distribuite alle Function Bay
```

La rappresentazione mostra le responsabilità, non la disposizione geometrica
definitiva. Il Power Flow può essere collocato sulla stessa Backbone compatta senza
essere elettricamente confuso con Input Flow e Output Flow.

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

Backbone diverse costituiscono nodi autonomi. Per esempio, una composizione può
acquisire una temperatura e un'altra pilotare un display. I due Core comunicano
attraverso il livello software; non è necessario un collegamento fisico diretto fra le
due Backbone.

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
    │            └── selector Function Bay OUT
    │
    └── rail B ── stessi possibili utilizzatori
```

Il disegno non congela il numero delle rail, degli stadi o il modo in cui il Core viene
alimentato. Fissa invece questi principi:

1. i Power Module possono essere concatenati per stadi;
2. ogni stadio riceve dal Power Flow e può passare un'uscita allo stadio successivo;
3. le uscite dichiarate come rail vengono distribuite dalla Backbone;
4. ogni Function Bay sceglie localmente la rail destinata al proprio `VCC`;
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

Per un sensore supportato da un'interfaccia generica non è necessario creare un nuovo
Interface Module: possono bastare un Connector/adattatore e un profilo software del
dispositivo.

## Naming e regole d'uso

I nomi canonici devono essere usati con questo significato:

| Termine | Indica | Non indica |
|---|---|---|
| Backbone | Base e distribuzione passiva della composizione | Un sensore o il Core |
| Core | Calcolo, comunicazione e terminazione dei Flow | L'intera composizione |
| Flow | Percorso fisico ordinato di segnali o power | Un singolo pin o una schermata software |
| Bay | Posizione fisica ordinata | Il protocollo o il dispositivo collegato |
| Module | Elemento funzionale sostituibile inserito in una Bay | Il Core, il Connector o l'External Device |
| Bay Interconnect | Contatti e accoppiamento fra Backbone e Module | Il connettore del sensore esterno |
| Interface Module | Adattamento elettrico riusabile | Necessariamente uno specifico sensore |
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
  quando l'interfaccia è riusabile.

## Compatibilità fra elementi

La compatibilità completa richiede contemporaneamente:

- revisione meccanica compatibile;
- revisione e pinout dei connettori compatibili;
- Flow e direzione compatibili;
- segnali del Core compatibili con l'Interface Module;
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
- meccanismo di fissaggio e gestione ordinata dei cavi esterni.

Queste voci non impediscono di usare l'architettura generale. Impediscono invece di
trattare il primo pinout o la prima meccanica come uno standard definitivo prima di
averli provati.

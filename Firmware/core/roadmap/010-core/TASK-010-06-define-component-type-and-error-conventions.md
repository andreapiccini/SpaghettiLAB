# TASK-010-06 — Definire le convenzioni per tipi ed errori

**Stato:** ⬜ TODO
**Fase:** 010 — Core
**Dipende da:** [TASK-010-05](TASK-010-05-structure-firmware-logging.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

I valori di dominio hanno nomi significativi di proprietà dei componenti mentre le
operazioni di facciata Zephyr fallibili mantengono valori di ritorno negativi
interoperabili.

---

## File da aprire

`FIRMWARE_IMPLEMENTATION_GUIDE.md`, `templates/firmware/change_contract.md.template`,
`templates/firmware/public_api.h.template`, `roadmap/README.md` e gli indici delle
attività per le fasi future dei componenti.

---

## Cosa scrivere o modificare

Aggiungi un passaggio obbligatorio chiamato **Inventario dei tipi** prima di implementare
l'API o gli algoritmi di ogni componente. L'inventario deve elencare ogni stato,
identificatore, modalità,
comando, valore, configurazione, snapshot, ragione diagnostica e lunghezza del buffer
che attraversa il confine del componente.

Aggiorna la roadmap in modo che ogni fase futura dei componenti definisca i suoi tipi
pubblici prima di implementare lo stato o gli algoritmi. Riusare un'attività type/API
focalizzata esistente quando già prevede quel gate; aggiungere o dividere un'attività
solo quando una fase attualmente salta direttamente dalla prosa all'implementazione non
digitata.

Non creare tutti i futuri tipi di firmware in questa attività. Questa attività definisce
le regole di decisione e assicura che le attività successive introducono ogni tipo solo
quando il suo contratto componente diventa concreto.

---

## Perché

Una variabile come `int value`, `int state` o `int error` non comunica quali valori sono
validi, quale componente possiede il significato, o se il valore è un risultato di
dominio o un guasto del sistema operativo.

Allo stesso tempo, la sostituzione di ogni ritorno `int` con un enum di errore
personalizzato avrebbe scartato la convenzione standard di errno negativo di Zephyr e
reso gli errori driver più difficili da propagare. Il sistema di tipo deve migliorare il
significato senza rompere l'integrazione.

---

## Regola di proprietà

Il componente che definisce il significato possiede il tipo:

| Significato | Proprietario e ubicazione | Esempio |
|---|---|---|
| Ciclo di vita Core | Intestazione pubblica Core | `enum spaghetti_core_state` |
| Port identity/capability | Intestazione pubblica Port | `spaghetti_port_id_t`, flag di funzionalità |
| Modulo kind/state | Intestazione pubblica del modulo | `enum spaghetti_module_state` |
| Comando driver | Contratto del driver del modulo | `enum spaghetti_module_command` |
| Configurazione Runtime | Contratto Config/Runtime | `struct spaghetti_runtime_config` |
| Codice Wire/protocol | Adattatore-confine privato | decodificato in un enum di dominio prima della spedizione |
| Errore Zephyr/driver | Ritorno della funzione | `int`, zero o negativo errno |

Un livello superiore non deve ridefinire l'enum di un componente inferiore né copiarne i
valori in interi anonimi.

---

## Norme relative alla decisione del tipo

### Usa un enum

Usa `enum spaghetti_<component>_<name>` quando i valori validi formano un piccolo
vocabolario chiuso conosciuto al momento della compilazione:

- stato del ciclo di vita;
- modalità o politica;
- tipo di comando o di evento;
- tipo value/discriminator;
- ragione diagnostica del dominio su cui i chiamanti realmente ramificano.

Ogni numeratore pubblico utilizza il prefisso completo dei componenti e ha un
significato documentato. Gli ingressi enum esterni sono convalidati perché C accetta i
valori interi non elencati dalla dichiarazione.

### Usa una struttura

Usa `struct spaghetti_<component>_<name>` quando i campi appartengono insieme e devono
essere convalidati, copiati, versioneti o restituiti come un'istantanea coerente:

- configurazione;
- sample/value più unità e timestamp;
- istantanea di stato;
- limitato request/response;
- uscita diagnostica dettagliata.

Non creare una struttura a un campo solo per evitare uno scalare.

### Usa un typedef

Utilizzare un typedef di progetto solo quando crea un'astrazione di dominio stabile,
come ad esempio un ID Port la cui rappresentazione può cambiare. Non nascondere
puntatori ordinari, strutture, interi a larghezza fissa o proprietà dietro typedef
decorativi.

### Usa interi a larghezza fissa

Utilizzare `uint8_t`, `uint16_t`, `uint32_t`, `uint64_t`, ed equivalenti firmati per
campi di protocollo, valori persistenti, contatori con limiti definiti, e dati di
registro hardware. Campo documento e unità. Non utilizzare `int` normale per un valore
di dominio solo perché è conveniente.

### Mantieni int per lo stato dell'operazione

Una funzione che può fallire restituisce `int`: `0` per il successo e un errore negativo
preciso per il fallimento. Public Doxygen elenca tutti i risultati attesi con `@retval`.
I chiamanti conservano gli errori di dipendenza a meno che non possano aggiungere un
contratto più preciso.

La variabile locale che tiene il risultato utilizza un breve campo di applicazione e un
nome convenzionale come `ret`. Viene controllata immediatamente e non viene mai
memorizzata come stato componente solo per evitare di gestirlo.

### Aggiungi un enum diagnostico solo quando necessario

Se i chiamanti hanno bisogno di una ragione di dominio al di là di errno, mantenere la
funzione ritorno come `int` e fornire un output separato digitato, ad esempio:

```c
enum spaghetti_config_reject_reason {
	SPAGHETTI_CONFIG_REJECT_NONE,
	SPAGHETTI_CONFIG_REJECT_UNKNOWN_PORT,
	SPAGHETTI_CONFIG_REJECT_UNSUPPORTED_DRIVER
};

struct spaghetti_config_diagnostic {
	enum spaghetti_config_reject_reason reason;
	uint16_t item_index;
};
```

L'API può restituire `-EINVAL` mentre la diagnostica opzionale spiega quale regola di
dominio ha respinto il candidato. Non creare un enum di errore personalizzato quando i
chiamanti hanno bisogno solo di success/failure o quando avrebbe duplicato i valori
errno.

---

## Chi usa il risultato

Ogni successiva API pubblica, attività di implementazione, revisione del codice, regola
validatore e template firmware.

---

## Evento che attiva il codice

TEMPI DI DESIGN, prima della prima dichiarazione pubblica di un componente o di una
caratteristica.

---

## Meccanismo di invocazione

Checklist di progettazione umana eseguita dall'ordine dei compiti, modelli, revisione
del Doxygen e regole di validatore focalizzate dove i controlli meccanici sono
affidabili.

---

## Contesto di esecuzione

Non applicabile a runtime. I tipi prodotti documentano i vincoli di proprietà ed
esecuzione di runtime.

---

## Input

- Componente responsabile e proprietario di `ARCHITECTURE.md`.
- Ingressi, uscite, gamme, unità, durata e comportamento di guasto dal suo README.
- Tipi di API Zephyr e contratti di errno negativi utilizzati al confine.

---

## Output

- Una sezione obbligatoria dell'inventario del tipo nel modello di contratto di cambio.
- Modelli copiabili enum/struct/result nel modello di intestazione pubblica.
- Una tabella di decisione sulla guida di attuazione per enum, struct, typedef, scalar,
errno, e diagnostica facoltativa digitata.
- Le fasi future della roadmap ordinate così i tipi precedono gli algoritmi.

---

## Errori da gestire

- Due componenti rivendicano la proprietà dello stesso tipo.
- Un intero pubblico non ha un'intervallo, un'unità o un nome semantico.
- Un enum personalizzato duplica `errno` senza aggiungere il significato del dominio.
- Un enum è utilizzato per un ID o una misurazione numerica a risposta aperta.
- Una struttura espone lo stato interno scrivibile o l'ambiguità della vita del
  puntatore.
- Un'attività successiva consuma un tipo prima dell'attività di definizione.

---

## Non implementare ancora

- Concrete future Port, Module, Config, Data, Runtime, MQTT, o Power tipi.
- Un terreno di dumping `common_types.h` condiviso.
- Variabili di errore globali, macro come eccezioni o ritorni iniziali nascosti.
- Sostituzione personalizzata dei valori Zephyr errno.
- Enum in formato Wire che fuoriescono direttamente nelle API di dominio di proprietà
  dei componenti.

---

## Procedura

- [ ] Aggiungere l'inventario obbligatorio del tipo e le domande di proprietà al modello
      di contratto di cambiamento.
- [ ] Aggiungi esempi documentati di enum, struttura, scalare a larghezza fissa, ritorno
      errno ed esempi di uscita diagnostica opzionali al modello API pubblico.
- [ ] Consolidare le regole di decisione nella guida di attuazione senza duplicare i
      pareri contrastanti.
- [ ] Verificare ogni indice di fase futura: il suo task type/API deve precedere stato,
      algoritmi, thread, persistenza o trasporti che consumano tali tipi.
- [ ] Registrare un proprietario del tipo esplicito in ogni componente interessato
      modello di dati di README quando il proprietario è attualmente ambiguo.
- [ ] Confermare l'attuale `enum spaghetti_core_state` segue le nuove regole senza
      aggiungere tipi di Core speculativi.
- [ ] Eseguire i controlli del link di documentazione e il validatore.
- [ ] Confermare nessun elemento da **Non implementare ancora** è stato aggiunto.

---

## Build

NO — questo task cambia solo le convenzioni, i modelli e l'ordine di roadmap.

---

## Flash

No.

---

## Verifica

Scegliere un tipo pianificato da Core, Port, modulo, Config, dati e Runtime. Per
ciascuno, identificare il suo proprietario, categoria di rappresentazione, values/range
valido, unità, public/private posizione, e convenzione di errore di funzione senza
inventare la sua implementazione.

Esaminare ogni indice di fase futura e confermare nessun task algoritmo appare prima del
task che definisce i tipi che consuma.

---

## Risultato atteso

Uno sviluppatore può decidere dalla guida e dai modelli se un nuovo valore è un enum,
una struttura, un typedef, uno scalare a larghezza fissa, un ritorno errno o una
diagnostica separata. Ogni componente futuro definisce tipi significativi prima degli
algoritmi, mentre gli errori Zephyr rimangono direttamente interoperabili.

---

## Checklist di completamento

- [ ] L'inventario del tipo è obbligatorio nel flusso di lavoro del contratto di cambio.
- [ ] I modelli contengono modelli copiabili, di tipo documentato e di risultati.
- [ ] Enum, struct, typedef, scalar, errno, e le decisioni diagnostiche sono
      inequivocabili.
- [ ] Ogni fase futura della componente definisce i tipi prima di consumarli.
- [ ] Lo stato Core soddisfa la politica senza aggiunte speculative.
- [ ] Non è stato introdotto alcun tipo comune di terreno di dumping o di sostituzione
      personalizzata.

---

## Commit suggerito

`docs: define component type and error conventions`

---

## Task successivo

[TASK-010-07](TASK-010-07-build-and-flash-the-core-boundary.md) — Compilare e provare il confine di Core

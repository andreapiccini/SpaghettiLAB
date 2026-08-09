# TASK-120-01 — Implementare Runtime V0

**Stato:** ⬜ TODO
**Fase:** 120 — Runtime V0

## Cosa devo fare

### Passo 1 — Definire l’API del task di campionamento Runtime

`include/spaghetti/runtime.h`.

Definire `spaghetti_runtime_sampling_task` con l'ID del modulo, i millisecondi del
periodo e il flag abilitato. Dichiarare Runtime init, caricare, avviare e interrompere
solo le funzioni; non aggiungere un linguaggio di scripting.

### Passo 2 — Implementare timer e semaforo del periodo

Crea `subsys/services/timer/timer.h` e `subsys/services/timer/timer.c`.

Avvolgi una `k_timer`. La sua callback di scadenza deve segnalare solo una `k_sem`
fornita con `k_sem_give()`. Implementare le chiamate init/start/stop delimitate e
mantenere la callback senza operazioni I2C, Manager e Data.

### Passo 3 — Implementare il thread di campionamento Runtime

`subsys/runtime/runtime.c`.

Crea un semaforo limitato e uno Runtime thread dedicato. Il thread attende con
`k_sem_take()`, chiama direttamente Manager legge per il modulo caricato, converte il
campione e pubblica attraverso i dati. Definisci esplicitamente la dimensione dello
stack e la priorità.

### Passo 4 — Implementare caricamento, avvio e arresto di Runtime

`subsys/runtime/runtime.c`.

Implementare la convalida e lo stato per init/load/start/stop. Rifiutare il periodo
zero, il modulo non valido, il doppio avvio e l'arresto prima dell'avvio. Avviare e
interrompere il servizio Timer senza lavorare nella callback timer.

### Passo 5 — Integrare Runtime con Core e Config

`CMakeLists.txt`, `subsys/core/core.c` e `subsys/config/config.c`.

Aggiungere sorgenti Runtime e Timer. Inizializzare Runtime da Core. Dopo l’applicazione di Config completa
l'assegnazione del modulo, risolvere l'ID del modulo, caricare l'attività di
campionamento 1000 ms e avviare Runtime. Propagare ogni guasto.

### Passo 6 — Rimuovere il loop da main e verificare la cadenza

`src/main.c` e la console seriale.

Rimuovi da `main` la lettura tramite Manager, la pubblicazione tramite Data e l'attesa
periodica. Lascia soltanto l'avvio del Core e la gestione degli errori. Esegui il flash,
osserva sequenza e timestamp di almeno dieci campioni, quindi verifica che lo stop
impedisca la produzione di nuovi campioni.

### Contratti completi da scrivere

```c
struct spaghetti_runtime_sampling_task {
	spaghetti_module_id_t module_id;
	uint32_t period_ms;
	bool enabled;
};
int spaghetti_runtime_init(void);
int spaghetti_runtime_load(const struct spaghetti_runtime_sampling_task *task);
int spaghetti_runtime_start(void);
int spaghetti_runtime_stop(k_timeout_t timeout);
```

La struct è pubblica e copiata da Runtime: `module_id` è la sorgente, `period_ms` è un
periodo non nullo in millisecondi, `enabled` decide se schedularla. `task` è un prestito
`const` valido per la chiamata. `timeout` limita l’attesa dello stop. Init crea risorse
e stato STOPPED; load valida/copia solo da fermo; start rifiuta task assente o doppio
avvio; stop impedisce nuove scadenze e attende il thread. Usa `-EINVAL`, `-ENOENT`,
`-EALREADY`, `-EBUSY` e `-ETIMEDOUT`.

In `timer.h` dichiara `int spaghetti_timer_init(struct k_sem *tick_sem);`,
`int spaghetti_timer_start(uint32_t period_ms);` e `int spaghetti_timer_stop(void);`.
Il semaforo è prestato ma deve avere lifetime firmware perché la callback lo conserva.
La callback fa soltanto `k_sem_give()`. Il thread Runtime possiede lettura, costruzione
messaggio e publish; stack e priorità sono costanti Kconfig documentate.

## Perché è fatto così

Timer e semaforo separano la scadenza breve dal thread che può bloccare su I2C e zbus.

## Come si usa

Core inizializza Runtime; Config carica il task; il timer dà il semaforo e il thread esegue Manager read → Data publish.

## Concetto Zephyr da sapere

### Implementare timer e semaforo del periodo

1. **Cos’è:** `k_timer` genera una scadenza periodica; `k_sem` è un semaforo che trasferisce il segnale a un thread autorizzato a bloccare ed eseguire I/O.
2. **A cosa serve:** La callback del timer resta breve e il lavoro I2C viene eseguito fuori dal contesto di scadenza.
3. **Quando viene usato:** Il timer chiama la callback alla scadenza; la callback esegue `k_sem_give()`, mentre il thread attende con `k_sem_take()`.
4. **Build-time o runtime:** Runtime.
5. **Collegamento con questo task:** Runtime deve campionare periodicamente senza eseguire Manager o I2C dentro la callback.
6. **File reali coinvolti:** `subsys/services/timer/timer.h` e `subsys/services/timer/timer.c`.
7. **Cosa guardare nei file:** Controlla inizializzazione, periodo, start/stop, semaforo ricevuto e assenza di operazioni bloccanti nella callback.
8. **Cosa non modificare:** Non leggere sensori, non pubblicare su zbus e non chiamare Manager dalla callback di `k_timer`.

### Implementare il thread di campionamento Runtime

1. **Cos’è:** Un thread Zephyr è un contesto schedulabile con entry function, stack e priorità espliciti.
2. **A cosa serve:** Esegue il lavoro che può attendere o bloccare, come `k_sem_take()`, lettura I2C e pubblicazione del campione.
3. **Quando viene usato:** Viene creato/avviato secondo la scelta del task e resta in attesa del semaforo tra due campionamenti.
4. **Build-time o runtime:** Runtime.
5. **Collegamento con questo task:** È il proprietario del ciclo di campionamento che prima viveva in `main`.
6. **File reali coinvolti:** `subsys/runtime/runtime.c`; eventuali dimensione stack e priorità configurabili appartengono al Kconfig del componente.
7. **Cosa guardare nei file:** Individua entry function, stack, priorità, attesa, uscita/stop e gestione degli errori.
8. **Cosa non modificare:** Non scegliere priorità casuali, non usare busy-wait e non passare al thread puntatori con durata insufficiente.

## Checklist di completamento

- [ ] Definire l’API del task di campionamento Runtime.
- [ ] Implementare timer e semaforo del periodo.
- [ ] Implementare il thread di campionamento Runtime.
- [ ] Implementare caricamento, avvio e arresto di Runtime.
- [ ] Integrare Runtime con Core e Config.
- [ ] Rimuovere il loop da main e verificare la cadenza.

## Verifica e fine task

Flasha e misura timestamp di almeno dieci campioni: periodo 1000 ms entro la tolleranza documentata. Stop deve fermare nuovi campioni; callback timer senza I/O verificata staticamente.

# TASK-190-01 — Gestire l’alimentazione condivisa

**Stato:** ⬜ TODO
**Fase:** 190 — Power

## Prima di scrivere: concetti Zephyr

### Verificare l’hardware di alimentazione controllabile

1. **Cos’è:** In questa fase `Power` è un componente Spaghetti LAB che controlla una rail o enable fisico. Non è ancora il sottosistema Zephyr di sospensione, deep sleep o device power management.
2. **A cosa serve:** Evita di confondere ownership di una risorsa elettrica condivisa con il risparmio energetico globale del sistema.
3. **Quando viene usato:** Prima si verifica lo schema e si misura l’hardware; il controllo runtime verrà implementato nei task successivi.
4. **Build-time o runtime:** Verifica hardware ora; gestione a runtime più avanti.
5. **Collegamento con questo task:** Devi provare che esista davvero una risorsa comandabile prima di definire API e algoritmi.
6. **File reali coinvolti:** schematico esterno della board, `dts/bindings/spaghetti/spaghettilab,port.yaml`, DTS della board sotto `boards/spaghettilab/` e `roadmap/190-power/README.md` per annotare la misura.
7. **Cosa guardare nei file:** Identifica segnale enable, polarità, stato al reset, rail alimentate, limiti e comportamento misurabile.
8. **Cosa non modificare:** Non abilitare opzioni Zephyr PM, non inventare wake source/deep sleep e non creare un driver se la rail non è controllabile.

### Implementare il reference counting con backend finto

Utilizzare il mutex solo intorno alle transizioni di stato corto. Non chiamare mai
questo blocco API da ISR o timer contesto di callback.

### Collegare Power al controllo hardware reale

Devicetree identifica il controllo fisico; il sottosistema Power possiede lo stato di
riferimento runtime e la politica di transizione.

## Perché lo facciamo

Il conteggio dei proprietari accende alla prima acquisizione e spegne all’ultimo rilascio, mantenendo rollback verificabile.

## Implementazione guidata

### Passo 1 — Verificare l’hardware di alimentazione controllabile

Apri lo schematico esterno della revisione reale,
`dts/bindings/spaghetti/spaghettilab,port.yaml`, il `.dts` della board selezionata e
`roadmap/190-power/README.md`, dove registrerai segnale, polarità e misure.

Identificare una risorsa di energia fisicamente controllabile, controllare la polarità,
stato di avvio sicuro, Port interessati, limiti elettrici, e il comportamento
misurabile on/off. Se non esiste, contrassegnare la fase BLOCKED e non inventare uno.

### Passo 2 — Definire l’API pubblica di Power

`include/spaghetti/power.h`.

Definire una risorsa ID/state contratto e dichiarare Power init, acquisire, rilasciare,
e get-status funzioni. identità del proprietario del documento, limiti di conteggio di
riferimento, thread-solo chiamate, e underflow comportamento.

### Passo 3 — Implementare il reference counting con backend finto

`subsys/power/power.c`.

Implementa lo stato privato con un breve `k_mutex`: in primo luogo acquisire chiamate un
falso power-on hook, intermedio acquire/release solo cambiare il numero, e le chiamate
di rilascio finale power-off. Rifiutare overflow, underflow, e resource/owner non
valido.

### Passo 4 — Provare proprietà e rollback di Power

`subsys/power/power.c`; crea `tests/power/CMakeLists.txt`, `tests/power/prj.conf` e
`tests/power/src/main.c` per il backend finto.

Esercizio di due proprietari acquiring/releasing in entrambi gli ordini,
duplicate/invalid rilascia, overflow border, fake on failure, e fake off failure.
Confermare i conti e lo stato rimangono coerenti dopo ogni errore.

### Passo 5 — Collegare Power al controllo hardware reale

Port binding/board DTS e `subsys/power/power.c`.

Aggiungere il riferimento di potenza verificato alla descrizione dell'hardware statico e
implementare i ganci on/off con `struct gpio_dt_spec` e `gpio_pin_set_dt()`. Non usare
runtime PM: questa fase controlla una linea enable fisica. Preservare la polarità sicura misurata e propagare gli errori di
transizione.

### Passo 6 — Integrare Power con Manager e provare l’hardware

`CMakeLists.txt`, `subsys/core/core.c`, `subsys/module_manager/module_manager.c` e
apparecchiature di misura reali.

Aggiungere il sorgente Power e inizializzarlo da Core. Manager acquisisce prima driver
init e rilascia dopo il deinit o ogni rollback. Misurare le transizioni
first-on/final-off e iniettare driver-init non confermare il rilascio.

### Contratti completi da scrivere

```c
typedef uint8_t spaghetti_power_resource_id_t;
typedef uint8_t spaghetti_power_owner_id_t;
enum spaghetti_power_state { SPAGHETTI_POWER_OFF, SPAGHETTI_POWER_STARTING, SPAGHETTI_POWER_ON, SPAGHETTI_POWER_STOPPING, SPAGHETTI_POWER_ERROR };
struct spaghetti_power_status { enum spaghetti_power_state state; uint16_t reference_count; int last_error; };
int spaghetti_power_init(void);
int spaghetti_power_acquire(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner);
int spaghetti_power_release(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner);
int spaghetti_power_get_status(spaghetti_power_resource_id_t id,
			       struct spaghetti_power_status *out);
```

ID e owner sono valori copiati. `out` è una snapshot del chiamante. La struct privata
per risorsa contiene descrittore hardware immutabile, stato, conteggio, bitmap/lista
limitata degli owner e mutex; Power la possiede per tutto il firmware. Acquire rifiuta
owner duplicato e overflow, accende solo su 0→1 e registra owner solo dopo successo.
Release rifiuta owner assente/underflow, spegne solo su 1→0 e conserva ownership se lo
spegnimento fallisce. Tutte le API sono thread-only e restituiscono errno precisi.
Prima usa hook fake in test; collega il `gpio_dt_spec` solo dopo aver verificato polarità,
safe state e risorsa reale nello schema. Manager acquisisce prima di driver init e
rilascia dopo deinit o in ogni rollback.

Significato di stato e campi:

- STARTING/STOPPING rendono osservabile una transizione mentre il mutex è posseduto;
- ERROR conserva un guasto hardware che non può essere rappresentato come ON/OFF;
- `reference_count` è il numero di owner distinti, non il numero di chiamate;
- `last_error` conserva l’errno dell’ultima transizione fallita.

`init()` valida ogni `gpio_dt_spec`, configura il safe state e azzera owner/count.
`acquire(id, owner)` è chiamata dal Manager prima di driver init: valida ID/owner,
blocca il mutex, rifiuta duplicati, esegue power-on solo con count zero, registra owner
e incrementa. `release` esegue il percorso inverso e non cancella owner/count se
power-off fallisce. `get_status(id, out)` copia uno snapshot sotto mutex; `out` è del
chiamante e cambia solo al successo.

In `subsys/power/power.c` crea:

```c
#define SPAGHETTI_POWER_MAX_OWNERS 8U

struct spaghetti_power_resource {
	spaghetti_power_resource_id_t id;
	struct gpio_dt_spec enable;
	enum spaghetti_power_state state;
	spaghetti_power_owner_id_t owners[SPAGHETTI_POWER_MAX_OWNERS];
	uint16_t reference_count;
	int last_error;
	struct k_mutex lock;
};
```

`id` identifica la rail; `enable` copia controller, pin e flag dal Devicetree, mentre
il device GPIO resta posseduto da Zephyr; `owners` impedisce doppie acquisizioni;
`reference_count` indica quanti elementi sono validi; `lock` serializza due thread.
Power possiede struct, array e mutex fino allo spegnimento.

## Esempio d’uso

```c
int err = spaghetti_power_acquire(resource_id, owner_id);
if (err == 0) {
	/* Usa la risorsa. */
	(void)spaghetti_power_release(resource_id, owner_id);
}
```

## Checklist di completamento

- [ ] Verificare l’hardware di alimentazione controllabile.
- [ ] Definire l’API pubblica di Power.
- [ ] Implementare il reference counting con backend finto.
- [ ] Provare proprietà e rollback di Power.
- [ ] Collegare Power al controllo hardware reale.
- [ ] Integrare Power con Manager e provare l’hardware.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Con backend fake prova due owner in entrambi gli ordini, duplicato, underflow, overflow e fallimenti on/off. Poi misura first-on/final-off reale e inietta init driver fallita per verificare il rilascio.

**Risultato atteso**

First-acquire/final-release comandano una sola transizione e ogni errore mantiene owner e count coerenti.

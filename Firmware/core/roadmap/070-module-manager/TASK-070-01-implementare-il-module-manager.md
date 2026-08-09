# TASK-070-01 — Implementare il Module Manager

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager

## Perché lo facciamo

Il Manager è l’unico proprietario degli slot e rende configurazione e rollback atomici per i chiamanti.

## Implementazione guidata

### Passo 1 — Dichiarare l’API di Module Manager

`include/spaghetti/module_manager.h`.

Scrivi le quattro firme complete mostrate nella sezione “Contratti completi da
scrivere”; non usare prototipi con `...`.

### Passo 2 — Implementare lo stato Manager con uno slot

`subsys/module_manager/module_manager.c`.

Crea uno slot `spaghetti_module` privato più un flag usato. Implementa
`spaghetti_module_manager_init()` per cancellare tutti gli stati e definire gli helper
ID/occupancy severi senza chiamare driver ancora.

### Passo 3 — Implementare la configurazione nel Manager

`subsys/module_manager/module_manager.c`.

Implementa la configurazione in questo ordine: convalidare il puntatore di uscita e lo
slot libero; chiamare `spaghetti_port_get()`; chiamare
`spaghetti_driver_registry_find()`; verificare le capacità richieste; popolare lo stato
provvisorio; chiamare driver `init`; commit READY e ID di output solo in caso di
successo. Cancellare lo slot su ogni guasto.

In questa fase il driver standard INA219 usa ancora il nodo statico e non riceve una
config runtime: chiama esattamente `driver->ops->init(&slot.module, NULL, 0U)`. La firma
del Manager verrà estesa, in modo esplicito, nella fase 080.

### Passo 4 — Implementare la lettura nel Manager

`subsys/module_manager/module_manager.c`.

Implementa `spaghetti_module_manager_get_by_port()` e `spaghetti_module_manager_read()`.
Convalida ID, stato usato, stato READY, puntatore di uscita, descrittore e funzionamento
`read` prima di effettuare una chiamata diretta driver.

### Passo 5 — Integrare Manager con Core e main

`CMakeLists.txt`, `subsys/core/core.c` e `src/main.c`.

Aggiungi sorgente Manager a CMake. Inizializzala da Core dopo il Registro. In `main`,
rimuovi l'oggetto principale del modulo, configura Port 0 come `ina219`, mantieni l'ID
del modulo restituito e leggi solo tramite Manager.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> L'assegnazione hardcoded Port 0/INA219 è intenzionalmente temporanea e verrà rimossa in
  [TASK-090-05](../090-config/TASK-090-01-implementare-config.md).

### Passo 6 — Provare successo e rollback del Manager

`subsys/module_manager/module_manager.c`, `src/main.c` e la console seriale.

Prova il percorso Port 0/INA219 valido, un tipo sconosciuto, uno Port occupato, una
lettura ID non valida e un errore di init driver forzato. Confermare ogni configurazione
non riuscita lascia lo slot riutilizzabile.

### Contratti completi da scrivere

```c
int spaghetti_module_manager_init(void);
int spaghetti_module_manager_configure(spaghetti_port_id_t port_id,
				       const char *type_id,
				       spaghetti_module_id_t *out_id);
const struct spaghetti_module *spaghetti_module_manager_get_by_port(
	spaghetti_port_id_t port_id);
int spaghetti_module_manager_read(spaghetti_module_id_t id,
				  struct spaghetti_sample *out);
```

Gli ID sono valori copiati. `type_id` è una stringa presa in prestito per la chiamata;
`out_id` e `out` sono destinazioni del chiamante e cambiano solo al successo. Il
puntatore restituito da `get_by_port()` è un prestito `const` allo slot del Manager,
valido finché lo slot non viene riconfigurato o rimosso.

La struct slot privata contiene `bool used`, una `struct spaghetti_module` e il buffer
context INA219; Manager la possiede per tutta la vita del firmware. `configure()` opera
in ordine: valida output e slot libero, risolve Port e driver, verifica capacità,
prepara uno slot provvisorio, chiama `driver->ops->init`, poi pubblica READY e `out_id`.
Su ogni errore azzera lo slot. Restituisce `-EINVAL`, `-ENOENT`, `-EBUSY`, `-ENOTSUP`,
`-ENOMEM` o l’errno del driver. `read()` valida READY e inoltra a `ops->read`.

Completa le altre funzioni senza deduzioni:

1. `spaghetti_module_manager_init()` azzera lo slot e restituisce `0`; Core la chiama
   dopo Port e Registry, una sola volta al boot.
2. `configure(port_id, type_id, out_id)` riceve gli ID per valore perché sono piccoli;
   `type_id` è `const` e valido per la chiamata; `out_id` è un puntatore perché la
   funzione restituisce sia status sia ID. Non scrivere `*out_id` prima del commit.
3. `get_by_port(port_id)` non modifica stato; restituisce un puntatore `const` allo
   slot o `NULL`. Il puntatore resta valido fino a riconfigurazione/rimozione e non deve
   essere conservato più a lungo.
4. `read(id, out)` è chiamata da Runtime o dal test. `out` è del chiamante, non è
   `const` perché viene scritto e resta invariato se la validazione o il driver fallisce.

La struct slot privata è:

```c
struct spaghetti_module_slot {
	bool used;
	struct spaghetti_module module;
	union {
		max_align_t alignment;
		uint8_t bytes[SPAGHETTI_MODULE_CONTEXT_SIZE];
	} driver_context;
};
```

`used` distingue slot libero e occupato; `module` contiene lo stato pubblico
dell’istanza; `alignment` forza l’allineamento adatto a qualunque tipo C e `bytes` è lo
storage limitato posseduto dal Manager per tutta la lifetime dello slot. Assegna
`module.context = slot.driver_context.bytes`. Definisci `SPAGHETTI_MODULE_CONTEXT_SIZE` con la size
esatta richiesta dal solo INA219 in questa fase e verifica a build-time che sia sufficiente.

## Esempio d’uso

```c
spaghetti_module_id_t module_id;
int err = spaghetti_module_manager_configure(0U, "ina219", &module_id);
if (err == 0) {
	struct spaghetti_sample sample;
	err = spaghetti_module_manager_read(module_id, &sample);
}
```

## Checklist di completamento

- [ ] Dichiarare l’API di Module Manager.
- [ ] Implementare lo stato Manager con uno slot.
- [ ] Implementare la configurazione nel Manager.
- [ ] Implementare la lettura nel Manager.
- [ ] Integrare Manager con Core e main.
- [ ] Provare successo e rollback del Manager.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Prova configure/read riusciti, Port occupato, tipo sconosciuto, capacità incompatibile e init driver fallita. Dopo ogni errore lo slot deve essere libero e gli output invariati.

**Risultato atteso**

Configure e read funzionano; ogni errore lascia lo slot libero e gli output invariati.

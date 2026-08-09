# TASK-070-01 — Implementare il Module Manager

**Stato:** ⬜ TODO
**Fase:** 070 — Module Manager

## Cosa devo fare

### Passo 1 — Dichiarare l’API di Module Manager

`include/spaghetti/module_manager.h`.

Dichiarare `int spaghetti_module_manager_init(void);`, `int
spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char *type_id,
spaghetti_module_id_t *out_id);`, `const struct spaghetti_module
*spaghetti_module_manager_get_by_port(...)` e `int
spaghetti_module_manager_read(spaghetti_module_id_t id, struct spaghetti_sample *out);`.

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

### Passo 4 — Implementare la lettura nel Manager

`subsys/module_manager/module_manager.c`.

Implementa `spaghetti_module_manager_get_by_port()` e `spaghetti_module_manager_read()`.
Convalida ID, stato usato, stato READY, puntatore di uscita, descrittore e funzionamento
`read` prima di effettuare una chiamata diretta driver.

### Passo 5 — Integrare Manager con Core e main

`CMakeLists.txt`, `subsys/core/core.c` e `src/main.c`.

Aggiungi sorgente Manager a CMake. Inizializzala da Core dopo il Registro. In `main`,
rimuovi l'oggetto principale del modulo, configura Port 0 come `sht40`, mantieni l'ID
del modulo restituito e leggi solo tramite Manager.

> [!ATTENZIONE]
> SCORCIATOIA TEMPORANEA
>
> L'assegnazione hardcoded Port 0/SHT40 è intenzionalmente temporanea e verrà rimossa in
  [TASK-090-05](../090-config/TASK-090-01-implementare-config.md).

### Passo 6 — Provare successo e rollback del Manager

`subsys/module_manager/module_manager.c`, `src/main.c` e la console seriale.

Prova il percorso Port 0/SHT40 valido, un tipo sconosciuto, uno Port occupato, una
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
context SHT40; Manager la possiede per tutta la vita del firmware. `configure()` opera
in ordine: valida output e slot libero, risolve Port e driver, verifica capacità,
prepara uno slot provvisorio, chiama `driver->ops->init`, poi pubblica READY e `out_id`.
Su ogni errore azzera lo slot. Restituisce `-EINVAL`, `-ENOENT`, `-EBUSY`, `-ENOTSUP`,
`-ENOMEM` o l’errno del driver. `read()` valida READY e inoltra a `ops->read`.

## Perché è fatto così

Il Manager è l’unico proprietario degli slot e rende configurazione e rollback atomici per i chiamanti.

## Come si usa

Config o il test chiamano `configure`; Runtime chiama `read`; il Manager valida lo slot e inoltra la chiamata al driver.

## Checklist di completamento

- [ ] Dichiarare l’API di Module Manager.
- [ ] Implementare lo stato Manager con uno slot.
- [ ] Implementare la configurazione nel Manager.
- [ ] Implementare la lettura nel Manager.
- [ ] Integrare Manager con Core e main.
- [ ] Provare successo e rollback del Manager.

## Verifica e fine task

Prova configure/read riusciti, Port occupato, tipo sconosciuto, capacità incompatibile e init driver fallita. Dopo ogni errore lo slot deve essere libero e gli output invariati.

# TASK-130-01 — Aggiungere Relay e la regola di soglia

**Stato:** ⬜ TODO
**Fase:** 130 — Relay + Runtime V1

## Cosa devo fare

### Passo 1 — Definire il contratto dei comandi Relay

`spaghetti_modules/relay/relay.h` e `include/spaghetti/module_driver.h`.

Aggiungi alla tabella delle operazioni del driver soltanto
`command(module, command, value)`, necessaria per impostare un valore booleano. Definisci
i tipi minimi per comando e valore del relè. Polarità e configurazione hardware restano
private nel driver e devono riferirsi a una capacità reale della Port.

### Passo 2 — Implementare ciclo di vita e comando sicuro del Relay

`spaghetti_modules/relay/relay.c` e le API Port/GPIO verificate.

Implementa `init` in modo che il relè assuma subito lo stato sicuro verificato.
Implementa il comando ON/OFF e fai in modo che `deinit` ripristini lo stato sicuro.
Accedi all'hardware tramite Port, senza numeri GPIO specifici della scheda, e propaga
gli errori hardware reali.

### Passo 3 — Registrare e compilare il driver Relay

`subsys/driver_registry/driver_registry.c` e `CMakeLists.txt`.

Aggiungi il descrittore immutabile del driver Relay al Registry e includi il relativo
sorgente in CMake. Estendi i controlli del Registry per rilevare duplicati e operazioni
mancanti nel percorso dei comandi, senza ridurre i controlli già previsti per SHT40.

### Passo 4 — Instradare i comandi tramite Module Manager

`include/spaghetti/module_manager.h` e `subsys/module_manager/module_manager.c`.

Dichiara e implementa `spaghetti_module_manager_command()`. Prima di chiamare il driver,
verifica l'ID del modulo, lo stato READY, il supporto dell'operazione e la validità del
valore. Aggiungi il modulo Relay alla configurazione di test usando soltanto hardware
già verificato.

### Passo 5 — Definire una regola di soglia

`include/spaghetti/runtime.h`.

Definisci `spaghetti_runtime_threshold_rule` con modulo e canale sorgente, soglia in
unità fissa, ID del relè di destinazione e valore booleano da applicare. Dichiara
`spaghetti_runtime_load_threshold_rule()` e limita esplicitamente questa versione a una
sola regola.

### Passo 6 — Valutare la temperatura nel thread Runtime

`subsys/runtime/runtime.c` e `subsys/data/data.c`.

Fai ricevere al thread Runtime i messaggi di temperatura tramite un subscriber zbus
basato su coda, oppure tramite il relativo `k_msgq`. Nel thread valuta
`temperature > 25 °C` e chiama il Module Manager soltanto quando lo stato ON/OFF
desiderato cambia.

### Passo 7 — Provare soglia e stato sicuro del Relay

L'hardware Relay reale, l'ingresso di test Runtime e la console seriale.

Inserisci o produci valori inferiori, uguali e superiori a 25 °C. Verifica il confronto
strettamente maggiore, l'assenza di comandi ripetuti inutilmente, lo stato sicuro durante
`init` e `deinit` e un errore controllato quando il modulo Relay non è disponibile.

### Contratti completi da scrivere

```c
enum spaghetti_command_type { SPAGHETTI_COMMAND_RELAY_SET };
struct spaghetti_command { enum spaghetti_command_type type; bool relay_on; };
struct spaghetti_relay_config { bool active_high; bool safe_on; };
int spaghetti_module_manager_command(spaghetti_module_id_t id,
				     const struct spaghetti_command *command);
struct spaghetti_runtime_threshold_rule {
	spaghetti_module_id_t source_id;
	int32_t threshold_millicelsius;
	spaghetti_module_id_t relay_id;
	bool relay_on_above;
};
int spaghetti_runtime_load_threshold_rule(
	const struct spaghetti_runtime_threshold_rule *rule);
```

Command e config sono pubblici e copiabili; i bool sono valori logici indipendenti
dalla polarità elettrica. `command` e `rule` sono prestiti `const` validi durante la
chiamata e vengono copiati se conservati. Manager valida ID/READY/ops e inoltra al
driver. Il context Relay privato conserva config e ultimo stato noto per la lifetime
dello slot. Init porta subito l’uscita a `safe_on`; command traduce stato logico e
polarità e aggiorna la cache solo dopo GPIO riuscito; deinit ripristina lo stato sicuro.

Runtime possiede una sola copia della regola. Per ogni campione della sorgente, usa
confronto strettamente `>`: sopra soglia invia `relay_on_above`, alla soglia o sotto
invia il valore opposto; evita scritture duplicate mantenendo l’ultimo comando.

## Perché è fatto così

Il relay resta un Module; Runtime applica una sola regola deterministica senza comandare direttamente l’hardware.

## Come si usa

Runtime confronta il campione con 25 °C e chiama `spaghetti_module_manager_command()`; il Manager inoltra SET al driver Relay.

## Concetto Zephyr da sapere

### Valutare la temperatura nel thread Runtime

1. **Cos’è:** `k_msgq` è una coda Zephyr a capacità e dimensione elemento fisse; copia ogni messaggio nel proprio buffer.
2. **A cosa serve:** Permette a un producer di consegnare dati a un thread consumer senza condividere memoria temporanea.
3. **Quando viene usato:** Il producer inserisce a runtime; il thread Runtime attende o estrae secondo il timeout scelto.
4. **Build-time o runtime:** Runtime.
5. **Collegamento con questo task:** Il message subscriber di zbus usa una coda per consegnare campioni temperatura al thread che valuta la soglia.
6. **File reali coinvolti:** `subsys/runtime/runtime.c` e le dichiarazioni zbus in `subsys/data/data.c`.
7. **Cosa guardare nei file:** Controlla dimensione elemento, profondità, timeout e comportamento quando la coda è piena.
8. **Cosa non modificare:** Non inserire puntatori a stack, non usare una coda non limitata e non comandare il Relay dalla callback zbus.

## Checklist di completamento

- [ ] Definire il contratto dei comandi Relay.
- [ ] Implementare ciclo di vita e comando sicuro del Relay.
- [ ] Registrare e compilare il driver Relay.
- [ ] Instradare i comandi tramite Module Manager.
- [ ] Definire una regola di soglia.
- [ ] Valutare la temperatura nel thread Runtime.
- [ ] Provare soglia e stato sicuro del Relay.

## Verifica e fine task

Con fake GPIO prova safe state, polarità, deinit ed errori; poi verifica sotto soglia, esattamente 25 °C e sopra soglia. Nessun comando duplicato e rollback sempre sicuro.

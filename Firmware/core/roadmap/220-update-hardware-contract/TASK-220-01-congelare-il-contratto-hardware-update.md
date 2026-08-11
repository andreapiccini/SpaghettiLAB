# TASK-220-01 — Congelare il contratto hardware dei tre segnali

**Stato:** ⬜ TODO
**Fase:** 220 — Contratto hardware update

## Cosa devo fare

Non modificare ancora `.c`, `.h`, DTS, Kconfig o CMake. Apri lo schema della scheda e
crea `UPDATE_HARDWARE_CONTRACT.md` nella root con una tabella che riporti, per ciascun
contatto, nome sul connettore, GPIO ESP32-C3, direzione in `NORMAL`, direzione in
`MAINTENANCE`, pull, livello attivo, tensione e comportamento al reset.

Il contratto proposto richiede tre **segnali**, oltre a massa e alimentazione:

```text
SDA / UART_RX       GPIO3   I2C in NORMAL, ingresso UART in MAINTENANCE
SCL / UART_TX       GPIO4   I2C in NORMAL, uscita UART in MAINTENANCE
MAINTENANCE_REQUEST <GPIO reale da schema> ingresso con pull e livello inattivo sicuro
```

Non sostituire `<GPIO reale da schema>` con un valore scelto liberamente. Se i “tre pin”
includono GND o alimentazione, questa proposta non è realizzabile: documenta il blocco e
prevedi almeno un contatto aggiuntivo oppure un connettore/pad di manutenzione.

Specifica anche chi guida ogni linea, se la base condivide i pull-up I2C e come evita di
pilotare TX mentre i pin sono ancora in open-drain. `MAINTENANCE_REQUEST` deve restare
inattivo collegando un normale sensore; non usare SDA/SCL tenuti bassi come trigger.

## Perché è fatto così

Il driver I2C ESP32-C3 di Zephyr 4.4 non supporta la modalità target e `mcumgr` non ha
un trasporto I2C. Riutilizzare SDA/SCL come UART è supportabile soltanto dopo avere
fermato I2C e applicato un diverso stato pinctrl. Un terzo segnale dedicato evita che un
sensore o un bus bloccato attivino accidentalmente la manutenzione.

## Come si usa

Il documento prodotto diventa l'unica sorgente ammessa per scrivere DTS e pinctrl nel
task 260. La base asserisce la richiesta, attende l'ACK definito nel contratto e soltanto
allora inizia a trasmettere UART.

## Checklist di completamento

- [ ] I tre segnali sono distinti da alimentazione e massa.
- [ ] Ogni segnale ha GPIO, direzione, pull, tensione e safe state verificati.
- [ ] Sono definiti tempi di richiesta, ACK, rilascio e timeout.
- [ ] È documentato come evitare contesa elettrica durante I2C → UART → I2C.
- [ ] Il contratto è confrontato con schema e datasheet, non con supposizioni.

## Verifica e fine task

Confronta `UPDATE_HARDWARE_CONTRACT.md` con schema e board DTS. Il task termina quando
non contiene placeholder e una normale periferica I2C non può soddisfare la sequenza di
ingresso in manutenzione.

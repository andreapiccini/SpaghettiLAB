# Piano OTA e manutenzione senza USB

[← Indice roadmap](README.md)

**Stato:** ⬜ PIANIFICATO

## Decisioni verificate su Zephyr 4.4 e Core V1

- La flash ESP32-C3 da 4 MiB è già divisa in `image-0` e `image-1`, entrambe da
  1792 KiB, più `image-scratch`: la base fisica per un aggiornamento A/B esiste.
- Il firmware non viene ancora costruito con MCUboot/sysbuild. Avere due partizioni
  non basta: boot di prova, conferma e rollback non sono ancora attivi.
- Zephyr 4.4 include Image Management di `mcumgr`, trasporto SMP UART e trasporto SMP
  UDP. Non include un trasporto SMP I2C.
- Il driver `i2c_esp32.c` installato espone controller/initiator, ma non le callback
  target/slave. Core V1 non può quindi presentarsi alla base come periferica I2C usando
  l'API Zephyr standard.
- GPIO3 e GPIO4 sono oggi SDA/SCL di Port 0. Nel DTS non esiste un terzo segnale di
  richiesta manutenzione. Il suo GPIO e il suo livello attivo devono provenire dallo
  schema, non da una supposizione software.
- La Shell Telnet di Zephyr è in chiaro e non offre autenticazione. Rimane utile solo
  come esperimento di laboratorio; non è il backend scelto per il prodotto.

## Comportamento finale richiesto

Il firmware parte sempre in uno di questi stati:

1. `UNPROVISIONED`: Config assente; niente Runtime, MQTT, scansione Wi-Fi automatica o
   listener OTA. Rimane disponibile soltanto il rilevamento passivo della richiesta
   fisica della base.
2. `NORMAL`: Config valida; Engine e Module usano normalmente le Port. I trasporti di
   aggiornamento sono chiusi.
3. `MAINTENANCE_ARMED`: stato esplicitamente richiesto e limitato nel tempo. Runtime e
   Module vengono fermati prima di cambiare funzione ai pin.
4. `RECEIVING`: l'immagine viene scritta esclusivamente in `image-1`; `image-0` resta
   avviabile.
5. `TRIAL_BOOT`: MCUboot avvia una sola volta la nuova immagine. Il firmware la conferma
   soltanto dopo i controlli di salute; un reset prima della conferma provoca rollback.

Un trasferimento interrotto non marca mai l'immagine come pending. Alla scadenza il
coordinatore chiude il trasporto, azzera lo stato di upload ed elimina la secondaria
incompleta. Nessun record Config persistente può impostare direttamente `RECEIVING` o
`TRIAL_BOOT`.

## Ordine dei task

1. [220 — Congelare il contratto hardware dei tre segnali](220-update-hardware-contract/README.md)
2. [230 — Attivare MCUboot e le immagini A/B firmate](230-mcuboot-ab/README.md)
3. [240 — Implementare il coordinatore sicuro degli aggiornamenti](240-update-coordinator/README.md)
4. [250 — Definire il boot sicuro con e senza Config](250-safe-boot-mode/README.md)
5. [260 — Aggiungere provisioning e update locale dalla base](260-local-maintenance-uart/README.md)
6. [270 — Aggiungere OTA Wi-Fi autenticato](270-wifi-ota/README.md)
7. [280 — Rendere `make monitor` multi-trasporto](280-remote-console/README.md)
8. [290 — Qualificare interruzioni, rollback e recovery](290-update-qualification/README.md)

Non iniziare un task se il precedente non è completato. In particolare il task 260
rimane tecnicamente bloccato finché il task 220 non associa il terzo segnale a un GPIO
reale e documentato.

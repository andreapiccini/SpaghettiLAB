# Piano OTA e manutenzione senza USB

[← Indice roadmap](README.md)

**Stato:** 🟨 IN CORSO

## Decisioni verificate su Zephyr 4.4 e Core V1

- La flash ESP32-C3 da 4 MiB è già divisa in `image-0` e `image-1`, entrambe da
  1792 KiB, più `image-scratch`: la base fisica per un aggiornamento A/B esiste.
- Sysbuild costruisce MCUboot e l'applicazione firmata ECDSA P-256. MCUboot usa lo
  swap tramite move, quindi il rollback è disponibile; la conferma applicativa del
  boot di prova verrà aggiunta nella fase 250.
- Zephyr 4.4 include Image Management di `mcumgr`, trasporto SMP UART e trasporto SMP
  UDP. Non include un trasporto SMP I2C.
- Il driver `i2c_esp32.c` installato espone controller/initiator, ma non le callback
  target/slave. Core V1 non può quindi presentarsi alla base come periferica I2C usando
  l'API Zephyr standard.
- GPIO3 e GPIO4 sono oggi SDA/SCL di Port 0 e verranno riutilizzati come RX/TX UART
  soltanto dal backend Core V1. Il firmware comune userà una capability dichiarata dal
  Devicetree e non conoscerà questi numeri.
- La Shell Telnet di Zephyr è in chiaro e non offre autenticazione. Rimane utile solo
  come esperimento di laboratorio; non è il backend scelto per il prodotto.

## Comportamento finale richiesto

Il firmware parte sempre in uno di questi stati:

1. `UNPROVISIONED`: Config assente; il Core entra direttamente in maintenance UART
   locale. Niente Runtime, MQTT, scansione Wi-Fi automatica o listener OTA di rete.
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

1. [220 — Definire il contratto astratto del Maintenance Link](220-update-hardware-contract/README.md)
2. [230 — Attivare MCUboot e le immagini A/B firmate](230-mcuboot-ab/README.md)
3. [240 — Implementare il coordinatore sicuro degli aggiornamenti](240-update-coordinator/README.md)
4. [250 — Definire il boot sicuro con e senza Config](250-safe-boot-mode/README.md)
5. [260 — Aggiungere provisioning e update locale dalla base](260-local-maintenance-uart/README.md)
6. [270 — Aggiungere OTA Wi-Fi autenticato](270-wifi-ota/README.md)
7. [280 — Rendere `make monitor` multi-trasporto](280-remote-console/README.md)
8. [290 — Qualificare interruzioni, rollback e recovery](290-update-qualification/README.md)

Non iniziare un task se il precedente non è completato. Il task 220 ha fissato il
confine hardware e il task 230 ha predisposto bootloader, firma e immagini A/B. Pin e
controller sono proprietà della board/overlay; i servizi comuni usano soltanto il
Maintenance Link.

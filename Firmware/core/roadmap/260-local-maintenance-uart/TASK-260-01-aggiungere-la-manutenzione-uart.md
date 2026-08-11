# TASK-260-01 — Aggiungere provisioning e update UART dalla base

**Stato:** ⬜ TODO
**Fase:** 260 — Manutenzione locale UART

## Cosa devo fare

Apri `UPDATE_HARDWARE_CONTRACT.md`, il binding Maintenance Link e il DTS/overlay della
Core selezionata. Aggiungi due stati pinctrl board-specific. Su Core V1 sono GPIO3/GPIO4
come I2C normale e gli stessi GPIO come RX/TX UART. Nessun file comune deve nominare
questi GPIO; un'altra overlay può fornire pin e controller diversi.

Crea `subsys/services/maintenance_link/` e implementa le API del contratto. Con Config
assente `enter(CONFIG_ABSENT)` abilita direttamente UART. Con Config valida `probe()`
mantiene TX inattivo e accetta un solo frame bounded/versionato/autenticato nella
finestra Devicetree. Un comando già autenticato può salvare il marker one-shot e
riavviare. Prima di `enter()`, Core ferma Runtime e Module, acquisisce la Port in modo
esclusivo, sospende I2C, applica pinctrl UART e abilita SMP UART.

Usa il framing SMP UART di Zephyr 4.4 per Image Management. Aggiungi un gruppo mcumgr
Spaghetti limitato a: leggere stato/versione, installare una Config CBOR e aggiungere o
rimuovere un profilo Wi-Fi senza scrivere password nei log. Non abilitare shell-mgmt,
file-mgmt o comandi arbitrari.

Al rilascio del segnale, timeout o errore: chiudi SMP UART, cancella l'upload incompleto,
ripristina pinctrl I2C e riapplica la Config precedente. Se l'immagine è completa,
richiedi boot di prova e riavvia soltanto dopo la risposta finale alla base.

## Perché è fatto così

La stessa coppia fisica non può essere contemporaneamente I2C e UART. Fermare l'Engine
prima del pinmux evita transazioni interrotte. Un trigger separato impedisce che un
sensore venga interpretato come programmatore.

## Come si usa

Senza Config la base trova UART locale già attiva. Con Config invia il payload durante
la finestra di boot oppure usa `maintenance reboot` attraverso un canale autenticato.
Dopo l'ingresso invia Config/profilo Wi-Fi e, separatamente, l'immagine firmata tramite
SMP UART.

## Checklist di completamento

- [ ] Nessun GPIO compare fuori da board DTS/overlay e pinctrl.
- [ ] Entrata/uscita dalla manutenzione sono atomiche rispetto alla Port.
- [ ] Password e payload firmware non compaiono nei log.
- [ ] Sensore, bus bloccato e frame invalido non attivano la modalità con Config valida.

## Verifica e fine task

Prova provisioning senza Config, aggiornamento completo, cavo staccato a percentuali
diverse e timeout senza traffico. Dopo ogni errore deve ripartire il vecchio firmware;
I2C deve tornare operativo senza power-cycle.

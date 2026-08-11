# TASK-260-01 — Aggiungere provisioning e update UART dalla base

**Stato:** ⬜ TODO
**Fase:** 260 — Manutenzione locale UART

## Cosa devo fare

Questo task può iniziare soltanto quando `UPDATE_HARDWARE_CONTRACT.md` non contiene
placeholder. Apri il DTS della nuova revisione e aggiungi due stati pinctrl reali:
GPIO3/GPIO4 come I2C normale e gli stessi GPIO come RX/TX UART di manutenzione. Aggiungi
il GPIO di richiesta con polarità presa dal contratto.

Crea `subsys/services/maintenance_link/`. Il servizio osserva il segnale dedicato,
chiede a Core di fermare Runtime e rimuovere i Module, acquisisce Port 0 in modo
esclusivo, sospende I2C, applica pinctrl UART e abilita SMP UART. Non cambia pinmux da
ISR: l'ISR segnala un worker bounded.

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

La base asserisce `MAINTENANCE_REQUEST`, attende ACK, invia prima Config/profilo Wi-Fi e
poi, se necessario, l'immagine firmata tramite SMP UART. Senza richiesta il modulino
resta in I2C normale oppure passivo se non configurato.

## Checklist di completamento

- [ ] Nessun GPIO o livello attivo è inventato.
- [ ] Entrata/uscita dalla manutenzione sono atomiche rispetto alla Port.
- [ ] Password e payload firmware non compaiono nei log.
- [ ] Sensore, bus bloccato e rumore non attivano la modalità.

## Verifica e fine task

Prova provisioning senza Config, aggiornamento completo, cavo staccato a percentuali
diverse e timeout senza traffico. Dopo ogni errore deve ripartire il vecchio firmware;
I2C deve tornare operativo senza power-cycle.

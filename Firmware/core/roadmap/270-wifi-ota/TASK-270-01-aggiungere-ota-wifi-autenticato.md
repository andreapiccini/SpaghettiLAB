# TASK-270-01 — Aggiungere OTA Wi-Fi autenticato

**Stato:** ⬜ TODO
**Fase:** 270 — OTA Wi-Fi

## Cosa devo fare

Apri `prj.conf`, Update, Wi-Fi Profiles e Communication. Abilita Image Management
mcumgr e il trasporto UDP di Zephyr 4.4 con avvio automatico disabilitato. Il servizio
chiama `smp_udp_open()` soltanto dopo una richiesta autenticata a
`spaghetti_update_arm()` e `smp_udp_close()` su completamento, cancel o timeout.

Proteggi il canale con DTLS e credenziali provisionate, non hard-coded nel repository.
La firma MCUboot resta obbligatoria anche con DTLS: DTLS autentica la sessione, la firma
autentica l'immagine al boot. Abilita soltanto Image Management e lo stretto gruppo
Spaghetti; non esporre shell, filesystem, settings o reset generico.

La finestra OTA non parte perché esiste il Wi-Fi: deve essere armata localmente dalla
base oppure da un futuro canale remoto già autenticato. Usa il callback upload-check
mcumgr per rifiutare upload quando stato, versione, dimensione o trasporto non sono
ammessi. Dimensione massima = capacità effettiva di `image-1` meno trailer MCUboot.

## Perché è fatto così

Un listener UDP permanente permetterebbe tentativi e consumo flash anche se una firma
impedisse l'avvio del codice ostile. La finestra breve, l'autenticazione del peer e la
firma risolvono problemi diversi e sono tutte necessarie.

## Come si usa

Dopo il provisioning locale, la base arma una finestra con timeout e comunica IP,
porta e credenziale temporanea al client autorizzato. Il client invia la signed image,
legge lo stato, la marca per test e attende boot/health confirmation.

## Checklist di completamento

- [ ] UDP è chiuso al boot e fuori dalla finestra.
- [ ] Peer non autenticato, firma errata e downgrade vengono rifiutati.
- [ ] Perdita Wi-Fi cancella la sessione incompleta dopo timeout.
- [ ] Config, Wi-Fi e vecchia immagine sopravvivono al rollback.

## Verifica e fine task

Prova peer valido, credenziale errata, immagine modificata, downgrade, rete persa,
power loss e aggiornamento sano. Fuori dalla finestra la porta UDP non deve rispondere.

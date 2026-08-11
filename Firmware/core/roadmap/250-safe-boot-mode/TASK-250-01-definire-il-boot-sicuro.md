# TASK-250-01 — Definire il boot sicuro con e senza Config

**Stato:** ⬜ TODO
**Fase:** 250 — Boot sicuro

## Cosa devo fare

Apri `include/spaghetti/core.h`, `subsys/core/core.c`, Config, Wi-Fi Profiles e Runtime.
Aggiungi alle informazioni Core un boot mode copiabile: `UNPROVISIONED`, `NORMAL` o
`TRIAL`. Non salvarlo come comando nella Config: viene derivato da presenza Config e
stato MCUboot.

Sequenza obbligatoria:

1. inizializza Storage, Communication locale passiva e Update;
2. se MCUboot segnala un'immagine non confermata, entra `TRIAL`;
3. se Config è assente, entra `UNPROVISIONED`: non avvia scansione Wi-Fi, MQTT,
   Discovery, Runtime o listener OTA;
4. se Config è valida, entra `NORMAL` e avvia l'Engine con trasporti update chiusi;
5. in `TRIAL`, avvia gli stessi componenti della Config e conferma con
   `boot_write_img_confirmed()` solo dopo Core READY, Storage leggibile, Communication
   viva e una finestra di stabilità;
6. se health check, watchdog o finestra falliscono, non confermare e riavviare: MCUboot
   ripristina l'immagine precedente.

## Perché è fatto così

Lo stato transitorio non deve sopravvivere come Config utente. Un sensore collegato non
può aprire un trasporto update e un firmware che non raggiunge READY non può rendersi
permanente.

## Come si usa

La Shell/status deve mostrare boot mode, versione, slot e conferma senza esporre
segreti. L'utente non può invocare direttamente `boot_write_img_confirmed()`.

## Checklist di completamento

- [ ] Boot senza Config resta passivo e configurabile localmente.
- [ ] Boot normale non espone listener update.
- [ ] Trial sano viene confermato dopo la finestra prevista.
- [ ] Trial guasto o bloccato viene riportato alla versione precedente.

## Verifica e fine task

Prova con test Core fake e hardware: Config assente, Config valida, immagine trial sana,
crash e watchdog prima della conferma. Il risultato atteso dopo il crash è il boot del
firmware precedente con Config persistente ancora leggibile.

# TASK-290-01 — Qualificare interruzioni, rollback e recovery

**Stato:** ⬜ TODO
**Fase:** 290 — Qualificazione update e recovery

## Cosa devo fare

Crea un report versionato sotto `verification/update/` e automatizza dove possibile la
matrice seguente per UART e Wi-Fi:

1. immagine valida completa;
2. immagine con firma, header o hash errati;
3. immagine più grande dello slot;
4. downgrade vietato;
5. disconnessione a 0%, 1%, 25%, 50%, 99% e prima del comando finale;
6. perdita di alimentazione durante scrittura e durante cambio stato;
7. reboot prima e dopo `BOOT_UPGRADE_TEST`;
8. crash, deadlock simulato e watchdog durante `TRIAL_BOOT`;
9. Config assente, Config corrotta e Storage temporaneamente illeggibile;
10. perdita Wi-Fi e console remota durante l'upload.

Per ogni prova registra versione iniziale/finale, slot attivo, swap type, stato Update,
Config preservata e motivo dell'esito. Verifica inoltre che la chiave privata di firma,
credenziali DTLS e password Wi-Fi non siano in Git, log, history Shell o artefatti
pubblicati.

La procedura di produzione deve distinguere: provisioning iniziale via USB che installa
MCUboot; aggiornamento locale dalla base; OTA Wi-Fi; recovery dalla base; eventuale
recovery fisica di fabbrica. Le operazioni eFuse/Secure Boot Espressif restano una
procedura separata e richiedono approvazione esplicita perché possono essere
irreversibili.

## Perché è fatto così

Una build riuscita non dimostra un aggiornamento sicuro. La proprietà importante è che
ogni interruzione lasci avviabile l'immagine precedente oppure una recovery locale
documentata.

## Come si usa

Il report accompagna ogni release candidata e riporta board revision, Zephyr, MCUboot,
chiave pubblica, versione e hash degli artefatti provati.

## Checklist di completamento

- [ ] Tutta la matrice è eseguita e ripetibile.
- [ ] Nessun caso lascia entrambi gli slot non avviabili.
- [ ] Config e credenziali restano coerenti dopo rollback.
- [ ] Recovery dalla base funziona con USB non accessibile.
- [ ] La console remota non indebolisce autenticazione o firma OTA.

## Verifica e fine task

Esegui validator, Twister completo, build pristine sysbuild e matrice hardware. Il piano
OTA è completo soltanto quando tutte le interruzioni previste tornano automaticamente
al vecchio firmware o alla recovery locale documentata.

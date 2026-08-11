# TASK-240-01 — Implementare il coordinatore sicuro degli aggiornamenti

**Stato:** ⬜ TODO
**Fase:** 240 — Coordinatore aggiornamenti

## Cosa devo fare

Crea `include/spaghetti/update.h`, `subsys/services/update/update.c`, il relativo
README e `tests/update/`. Definisci stati pubblici `IDLE`, `ARMED`, `RECEIVING`,
`VERIFYING`, `PENDING_REBOOT`, `TRIAL_BOOT` e `ERROR`, più una snapshot copiata.

L'API minima è:

```c
int spaghetti_update_init(void);
int spaghetti_update_arm(uint32_t timeout_ms);
int spaghetti_update_begin(enum spaghetti_update_transport transport);
int spaghetti_update_finish(void);
int spaghetti_update_cancel(void);
int spaghetti_update_get_status(struct spaghetti_update_status *out);
```

`timeout_ms` è passato per valore perché è un numero piccolo; zero è invalido. `out` è
un puntatore modificabile posseduto dal chiamante. `begin()` viene chiamata da un
adapter locale o Wi-Fi soltanto dopo `arm()`. `finish()` verifica che l'immagine sia
completa e firmata, poi richiede `BOOT_UPGRADE_TEST`, mai permanent. `cancel()` chiude
il trasporto, chiama il reset upload di Image Management e cancella soltanto lo slot
secondario. Restituisci `-EALREADY`, `-EPERM`, `-ETIMEDOUT`, `-EBUSY` e gli errno flash
nei casi corrispondenti.

Usa mutex, work delayable e memoria statica; non usare heap. Core possiede il servizio
per tutta la vita del firmware. Nessuna password, URL o buffer immagine entra nella
snapshot o nei log.

## Perché è fatto così

UART e Wi-Fi devono condividere la stessa macchina a stati. Il trasporto sposta byte;
il coordinatore decide se è lecito riceverli e cosa fare dopo errori o timeout.

## Come si usa

```c
err = spaghetti_update_arm(60000U);
if (err == 0) {
	err = spaghetti_update_begin(SPAGHETTI_UPDATE_TRANSPORT_UART);
}
```

## Checklist di completamento

- [ ] Transizioni valide e invalide sono testate.
- [ ] Due adapter concorrenti non possono aggiornare insieme.
- [ ] Timeout e cancel cancellano la secondaria incompleta.
- [ ] `finish()` usa sempre il boot di prova MCUboot.

## Verifica e fine task

Esegui `./validator` e Twister su `tests/update`. Con backend flash/boot fake, verifica
upload interrotto, timeout, errore firma, candidato completo e concorrenza UART/UDP.

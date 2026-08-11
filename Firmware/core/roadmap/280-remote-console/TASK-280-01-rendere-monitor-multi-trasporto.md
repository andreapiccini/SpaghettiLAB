# TASK-280-01 — Rendere make monitor multi-trasporto

**Stato:** ⬜ TODO
**Fase:** 280 — Console remota

## Cosa devo fare

Non abilitare `CONFIG_SHELL_BACKEND_TELNET`: in Zephyr 4.4 ascolta in chiaro e non
autentica il client. Crea un adapter di manutenzione di rete autenticato sopra TLS o
DTLS che inoltra richieste bounded a `spaghetti_communication_handle_request()` e
pubblica copie bounded dei log. Non dare al socket accesso diretto a Config, Manager o
Update.

Il servizio accetta una sola sessione, usa timeout di inattività e code statiche; se il
client è lento scarta i log più vecchi senza bloccare producer e Runtime. Operazioni
sensibili come armare OTA o richiedere `maintenance reboot` richiedono una sessione
autenticata e una policy esplicita. Il comando di reboot salva un marker one-shot
separato dalla Config e risponde al client prima di riavviare.

Apri `tools/device.py` e aggiungi trasporti host separati mantenendo un solo formatter:

```text
make monitor                         # auto/USB, comportamento attuale
make monitor TRANSPORT=serial PORT=/dev/...
make monitor TRANSPORT=network HOST=192.0.2.10 PORT=...
```

Il client di rete verifica identità/certificato del dispositivo; non offre un'opzione
silenziosa per ignorare la verifica. Ctrl+X chiude solo il monitor, Ctrl+C viene inviato
alla console scelta.

## Perché è fatto così

“Più canali” riguarda il trasporto, non una seconda implementazione dei comandi. Il
confine Communication mantiene lo stesso comportamento via USB e rete; cifratura e
autenticazione impediscono a un host nella LAN di ottenere una shell amministrativa.

## Come si usa

Il monitor mostra nel pannello iniziale trasporto, endpoint e identità verificata. Le
tabelle Rich e il prompt rimangono uguali a quelli seriali.

## Checklist di completamento

- [ ] Serial e network condividono parser e formatter.
- [ ] Certificato/credenziale errata impedisce la connessione.
- [ ] Timeout e disconnessione liberano la sessione.
- [ ] Log flood e client lento non bloccano il firmware.

## Verifica e fine task

Prova USB, rete valida, identità errata, due client concorrenti, Wi-Fi perso e log flood.
Il risultato atteso è una console leggibile su entrambi i trasporti e nessun listener
remoto quando la policy lo disabilita.

# TASK-380-01 — Creare il CLI Spaghetti V1

**Stato:** ⬜ TODO
**Fase:** 380 — Tool sviluppatore V1

## Cosa devo fare

### 1. Creare un comando unico senza duplicare device.py

Crea `tools/spaghetti.py`, `tools/spaghetti_protocol.py` e
`tools/tests/test_spaghetti_cli.py`. `device.py` resta owner di seriale, TLS-PSK,
discovery porte e monitor; estrai helper riutilizzabili in `tools/transports.py` solo
quando entrambi i programmi li usano.

Aggiorna `tools/requirements.txt` con versioni bounded di `cbor2` e `paho-mqtt`.
`make host-tools` continua a creare `.venv`; nessuna installazione globale.

CLI:

```text
spaghetti catalog
spaghetti status
spaghetti config validate <config.json>
spaghetti config apply <config.json>
spaghetti discovery scan --port <id> [--allow-state-changing]
spaghetti discovery list
spaghetti discovery accept <candidate> --key <key>
spaghetti module command <key> <command> [field=value ...]
spaghetti update uart <signed.bin>
spaghetti update wifi <host> <signed.bin>
```

Ogni comando accetta `--transport serial|network|mqtt`, `--credentials` dove serve e
un timeout finito. Default `auto` è ammesso solo quando esiste una scelta univoca.

### 2. Usare il catalogo per trasformare JSON in field ID

Il file utente contiene nomi leggibili:

```json
{
  "modules": [
    {
      "key": 10,
      "port": 0,
      "type": "ina219",
      "properties": {
        "i2c_address": 64,
        "shunt_milliohm": 100,
        "current_lsb_microamp": 200
      }
    }
  ],
  "schedules": [
    {"source_key": 10, "period_ms": 1000, "enabled": true}
  ],
  "rules": []
}
```

Il CLI legge catalogo dal Core, risolve nome → field ID/type/range, produce Config CBOR
V2 e può salvarla con `--output`. Non possiede una tabella INA219. Se il Core non
conosce tipo/campo, termina prima di inviare. `validate` non cambia dispositivo.

### 3. Uniformare request, response ed errori

`spaghetti_protocol.py` implementa envelope V1, correlation monotonic random-start,
paginazione catalog/status/discovery e mapping errno → testo. Ogni transport invia gli
stessi byte. Il CLI stampa tabelle Rich ma `--json` produce output macchina stabile e
`--quiet` restituisce soltanto exit status.

Credenziali e password non compaiono in argv quando possono essere lette da prompt/file
0600. Il log debug oscura payload sensibili.

### 4. Completare i client update già previsti dal firmware

UART usa framing SMP Zephyr e gruppo Spaghetti 64 sui pin/USB disponibili; Wi-Fi usa
DTLS-PSK UDP 1337. Entrambi:

1. verificano localmente `imgtool verify`/header/versione;
2. leggono status/offset;
3. inviano chunk ordinati bounded;
4. mostrano percentuale e throughput;
5. cancellano la sessione su Ctrl+C quando il link esiste;
6. finalizzano come trial, mai confirmed;
7. si riconnettono e verificano versione/slot/confirmed dopo il boot.

Il client non bypassa firma MCUboot e non contiene chiavi private. Un resume è ammesso
solo se device, hash, total size e sessione coincidono; altrimenti cancel e restart.

### 5. Aggiungere Makefile ergonomico

```make
spaghetti: host-tools
	@$(HOST_VENV_PYTHON) tools/spaghetti.py $(ARGS)

config-validate: host-tools
	@$(HOST_VENV_PYTHON) tools/spaghetti.py config validate "$(CONFIG)"

config-apply: host-tools
	@$(HOST_VENV_PYTHON) tools/spaghetti.py config apply "$(CONFIG)"
```

Documenta esempi in README senza inserire credenziali. `CONFIG` è un percorso locale;
non confonderlo con simboli Kconfig.

### 6. Testare senza dispositivi

Usa fake transport in-memory con risposte catalog paginato, status, candidate e update
offset. Copri JSON errato, campo sconosciuto, range, timeout, correlation sbagliata,
response duplicata, disconnect a varie percentuali, resume mismatch, file credential
con permessi insicuri e output `--json` stabile.

## Perché è fatto così

Il catalogo rende il tool indipendente dai Module compilati. JSON è l'interfaccia
umana; CBOR è quella macchina. Un solo CLI riduce la necessità di ricordare Shell,
hex, mcumgr e dettagli dei trasporti, mentre il monitor resta specializzato.

## Come si usa

```sh
make spaghetti ARGS='catalog --transport network --host 192.168.1.23'
make config-validate CONFIG=configs/lab.json
make config-apply CONFIG=configs/lab.json
```

Dopo questa fase lo stesso JSON può essere generato o inviato dal flow Node-RED.

## Checklist di completamento

- [ ] CLI usa catalogo, non tabelle driver locali.
- [ ] JSON viene validato prima dell'invio.
- [ ] Serial, TLS e MQTT trasportano lo stesso envelope.
- [ ] UART/DTLS update mostrano progress e verificano trial.
- [ ] Nessun segreto entra in argv/log/repository.
- [ ] Fake coprono errori, reconnect e resume.

## Verifica e fine task

```sh
make host-tools
.venv/bin/python -m unittest discover -s tools/tests -v
make validate
make pristine
```

Il risultato atteso è configurare e comandare un fake Core da JSON senza costruire
manualmente CBOR o conoscere un driver concreto.

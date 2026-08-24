# Connect — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

- Nome obbligatorio (trim); se vuoto, errore locale sotto il campo.
- Indirizzo host opaco sul wire. `mqtt://` / `ws://` apre un Core MQTT; `https://` / `cloud://loopback` apre un CloudHost HOST_API.
- Tap card → panoramica del sistema.
- Sheet: chiudi con swipe o tap fuori; controller rilasciati alla chiusura.
- Aggiungi sistema solo con scope `host.system.manage`.
- Login: schermate `login` / `select-site` (E050).

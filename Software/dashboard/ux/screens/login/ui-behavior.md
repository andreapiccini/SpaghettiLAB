# Login — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

- Email e password obbligatori (trim email); se vuoti, errore locale.
- Submit disabilitato mentre la richiesta è in corso.
- Credenziali errate: "Accesso non consentito" (niente dettaglio password).
- Se la sessione ha più siti senza `selectedSiteId`, passa a `select-site`.
- Nessun MQTT, nessun SDK.

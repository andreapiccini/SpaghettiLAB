# Settings — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

- Kiosk: nasconde AppBar e toggle Modifica sul canvas.
- Compatto: griglia canvas più densa.
- Tap Aspetto / Marketplace → cambia tab (nascosti senza scope).
- Marketplace disabilitato se `capabilities.marketplace=false`.
- Account + Esci (`POST /v1/auth/logout`).
- Voce automazioni non naviga.
- Tab **Utenti** visibile solo con `host.user.manage`. Senza lo scope, resta solo Display.
- Invito: email + ruolo visitatore | operatore. Nessun ruolo integratore in UI.
- Revoca: conferma; non si può revocare se stessi. Stato `revoked` resta in elenco.
- Sessioni: sola lettura (dispositivo, ultimo accesso, “Questa sessione”).
- “Richiedi supporto SpaghettiLAB” apre placeholder E080 (dialogo, nessun grant reale).

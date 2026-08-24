# Settings — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

- Kiosk: nasconde AppBar e toggle Modifica sul canvas.
- Compatto: griglia canvas più densa.
- Tap Aspetto / Marketplace → cambia tab (nascosti senza scope).
- Marketplace disabilitato se `capabilities.marketplace=false`.
- Account + Esci (`POST /v1/auth/logout`).
- Voce automazioni non naviga.
- Tab **Utenti** visibile solo con `host.user.manage`.
- Tab **Supporto** visibile con `host.support.grant.approve` o `host.support.session`.
- Invito: email + ruolo visitatore | operatore. Nessun ruolo integratore in UI.
- Revoca utente: conferma; non si può revocare se stessi. Stato `revoked` resta in elenco.
- Sessioni: sola lettura (dispositivo, ultimo accesso, “Questa sessione”).
- Supporto: Richiedi crea grant `pending`; Approva apre sessione 8h `read_only`; Revoca o scadenza chiudono l’accesso.
- Senza grant approvato, `spaghetti_support` vede la schermata di attesa (niente canvas).

# UX-S120 — Settings, Security & Recovery

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S121–S124

## Obiettivo

Specificare credenziali, permessi, backup/import/export e recovery guidato — con lo
stesso dettaglio di `ux/screens/S070-processing-graph-editor/`. Questa schermata
applica per prima la convenzione "conferme distruttive" già definita in
`UX_ARCHITECTURE.md` § Convenzioni cross-cutting.

## Cosa deve coprire

- Credential store: come si aggiunge/rimuove una credenziale per riferimento
  opaco — il valore del segreto non deve mai apparire in un campo di testo leggibile
  dopo il salvataggio.
- Permission matrix locale: come si comunica "questa operazione è disabilitata
  perché non hai il permesso", distinto da un errore di rete.
- Autosave/backup/version history: indicatore di stato salvataggio, come si accede a
  una versione precedente.
- Import con preview (schema/size limit, artifact sconosciuti preservati) prima di
  confermare — mai un'importazione "silenziosa".
- Export selettivo con redaction visibile: cosa viene escluso (credenziali, record
  live) e come l'utente lo vede prima di esportare.
- Audit log: vista sola lettura, append-only, senza payload segreti.
- Le conferme distruttive per ciascun caso previsto da S124 (factory reset,
  rimozione credenziale, profilo in uso, downgrade firmware, rimozione risorsa
  Node-RED) — tutte con lo stesso pattern (`elevation.3`, target esplicito,
  `color.error`, digitare il nome per confermare le azioni multi-Core).
- Recovery guidato: Core sostituito, device ID mismatch, Config corrotto/assente,
  catalogo incompatibile, OTA rollback, Node-RED irraggiungibile — ciascuno con il
  proprio percorso, non un unico "riprova" generico.

## Implementazione richiesta

1. `ux/screens/S120-settings-security/visual.md`
2. `ux/screens/S120-settings-security/ui-behavior.md`
3. `ux/screens/S120-settings-security/backend-behavior.md` — riferisce S121
   (credential/permission), S122 (persistenza), S123 (import/export/audit), S124
   (conferme/recovery).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S121/S122/S123/S124 per ogni operazione descritta, non
  una spiegazione generica.

## Fine task

- [x] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [x] La riga "Settings, Security & Recovery" in `UX_ARCHITECTURE.md` passa a "✅".

## Implementazione (2026-08-12)

Scritti `ux/screens/S120-settings-security/{visual.md,ui-behavior.md,backend-behavior.md}`.
Sei tab (Credenziali/Permessi/Backup & Versioni/Import-Export/Audit/Recovery).
Credenziali sempre per riferimento opaco, mai un campo che ripopola un segreto
esistente. Permesso mancante visivamente distinto da errore di rete. Export con
sezione "Escluso automaticamente" sempre visibile e due opt-in espliciti
deselezionati di default. Sei flussi di recovery guidato dedicati, mai un "riprova"
condiviso. Pattern unico di conferma distruttiva (device ID/scope/conseguenze
prima della conferma, digitare il nome per azioni multi-Core) applicato a tutte e
cinque le operazioni di S124. `backend-behavior.md` cita S121/S122/S123/S124 punto
per punto (tutte ⬜ TODO). **Questo era l'ultimo task della roadmap UX — tutte le 11
schermate sono ora documentate.**

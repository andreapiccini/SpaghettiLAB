# UX-S030 — Core Connections

**Stato:** ⬜ TODO
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S030

## Obiettivo

Specificare come si connettono, identificano e sincronizzano più Core, rendendo
visibile lo stato di sessione senza ambiguità — con lo stesso dettaglio di
`ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Elenco Core del progetto (`coreBindings`), stato vuoto (nessun Core ancora
  collegato) con azione "Connetti un Core".
- La state machine di sessione per intero, resa visivamente distinguibile:
  `DISCONNECTED → CONNECTING → AUTHENTICATING → SYNCHRONIZING → READY`, e i
  sottostati `VALIDATING`/`APPLYING`/`UPDATING → REBOOTING → TRIAL`/`ERROR`.
- La relazione progetto/dispositivo, separata dallo stato di sessione:
  `IN_SYNC | PROJECT_DIRTY | DEVICE_CHANGED | DIVERGED | INCOMPATIBLE` — con colori
  semantici distinti (vedi `UX_ARCHITECTURE.md` § Colore) e un'azione esplicita per
  ciascun caso (mai auto-apply al reconnect).
- Un Core offline resta editabile con l'ultimo snapshot noto, marcato "stale" — come
  si comunica visivamente questo stato.
- Isolamento errori: un Core in errore non deve far sembrare rotti gli altri Core del
  progetto.

## Implementazione richiesta

1. `ux/screens/S030-core-connections/visual.md`
2. `ux/screens/S030-core-connections/ui-behavior.md`
3. `ux/screens/S030-core-connections/backend-behavior.md` — riferisce S030 (Device
   Session Manager), `DeploymentRecord`/hash da S014 per la classificazione sync.

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S030 per ogni transizione di stato descritta, non una
  spiegazione generica.

## Fine task

- [ ] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [ ] La riga "Core Connections" in `UX_ARCHITECTURE.md` passa a "✅".

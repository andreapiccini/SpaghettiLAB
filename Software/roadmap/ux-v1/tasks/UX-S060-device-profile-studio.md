# UX-S060 — Device Profile Studio

**Stato:** ⬜ TODO
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S061–S063

## Obiettivo

Specificare l'editor con cui si descrive un nuovo sensore/attuatore compatibile con
gli opcode già installati, senza aggiornamento firmware — con lo stesso dettaglio di
`ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Editor delle istruzioni catalogate (transazioni I2C/SPI/UART, GPIO/ADC, wait,
  byte operations, CRC) — probabilmente una sequenza ordinata di step, non un grafo:
  chiarire perché questa schermata NON usa il canvas React Flow.
- I sei esiti del resolver, ciascuno con la sua rappresentazione visiva e la sua
  azione: `READY`, `PROFILE_INSTALL_REQUIRED`, `FIRMWARE_UPDATE_REQUIRED`,
  `HARDWARE_INCOMPATIBLE`, `RESOURCE_INCOMPATIBLE`, `VERSION_CONFLICT` — non sei
  varianti dello stesso banner, sei situazioni con remediation diverse.
- Import/export di un pacchetto profilo, con ID/versione/hash visibili.
- Vincoli elettrici che derivano dalla Bay scelta (S050), non dal testo del profilo —
  come si comunica questo vincolo mentre l'utente compila il form.
- Stato "opcode assente" → propone un Capability Pack, non tenta un'installazione dati.

## Implementazione richiesta

1. `ux/screens/S060-device-profile-studio/visual.md`
2. `ux/screens/S060-device-profile-studio/ui-behavior.md`
3. `ux/screens/S060-device-profile-studio/backend-behavior.md` — riferisce S061
   (authoring), S062 (resolver), S063 (install).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S061/S062/S063 per ogni operazione descritta, non una
  spiegazione generica.

## Fine task

- [ ] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [ ] La riga "Device Profile Studio" in `UX_ARCHITECTURE.md` passa a "✅".

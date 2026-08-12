# UX-S050 — Physical Composition Editor

**Stato:** ⬜ TODO
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S050

## Obiettivo

Specificare l'editor con cui l'utente rappresenta cosa è fisicamente collegato a un
Core (Backbone → Power → Connector/Bay → Core → Bay/Connector) — con lo stesso
dettaglio di `ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Canvas del Physical Composition Graph: come si distinguono visivamente Backbone,
  Power, Core, Function Bay, Connector, dispositivo esterno — probabilmente icone e
  non gli stessi "block" del Processing Graph Editor, perché qui il grafo rappresenta
  hardware reale, non logica.
- Configurazione di un Module (address/rail/endpoint) — form generato da schema
  (`EditorModel`), stessa logica di validazione locale del Processing Graph Editor
  (S042), stesso principio "errore isolato di campo prima del backend".
- Collisione di indirizzi (due Module I2C sulla stessa Port con lo stesso indirizzo) —
  come si segnala prima del deploy, non solo al momento del deploy.
- Flusso di accettazione di un candidato da discovery: preview, confidence/authority,
  confronto, accetta/rifiuta — nessun apply automatico.
- Power passivo `UNVERIFIED` — non deve mai apparire visivamente come `ENFORCED`.

## Implementazione richiesta

1. `ux/screens/S050-physical-composition/visual.md`
2. `ux/screens/S050-physical-composition/ui-behavior.md`
3. `ux/screens/S050-physical-composition/backend-behavior.md` — riferisce S050.

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S050 per ogni operazione descritta, non una spiegazione
  generica.

## Fine task

- [ ] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [ ] La riga "Physical Composition Editor" in `UX_ARCHITECTURE.md` passa a "✅".

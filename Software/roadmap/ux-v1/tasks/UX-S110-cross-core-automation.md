# UX-S110 — Cross-Core Automation

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S111–S113

## Obiettivo

Specificare come si collegano output/comandi di Core distinti tramite Node-RED — con
lo stesso dettaglio di `ux/screens/S070-processing-graph-editor/`. Concettualmente
vicina al Processing Graph Editor (canvas a blocchi collegati), ma i nodi qui
rappresentano campi/comandi di Core diversi, non Block locali.

## Cosa deve coprire

- Il System Automation Graph come canvas: come si distingue visivamente da un
  Processing Graph (S070) perché qui gli endpoint sono `Core record field`/
  `Core command`, non Module/Rule/Block — probabilmente serve un colore/stile di
  nodo dedicato, non le categorie di S070.
- Collegamento con trasformazione esplicita quando gli schemi differiscono (es.
  temperatura Core A → display Core B con unità diverse) — come si presenta questa
  scelta all'utente, non un'conversione implicita e invisibile.
- Stato del deploy Node-RED: revisionato, scoped, conserva i flow non posseduti dal
  progetto — come si comunica "questo deploy tocca solo i tuoi nodi, non l'intero
  Node-RED".
- Diagnostica end-to-end: dal record source al command target, con Core/Node-RED
  offline visibili senza fermare gli altri runtime.
- Link stale dopo un catalog change — come si segnala e come si rivalida.

## Implementazione richiesta

1. `ux/screens/S110-cross-core-automation/visual.md`
2. `ux/screens/S110-cross-core-automation/ui-behavior.md`
3. `ux/screens/S110-cross-core-automation/backend-behavior.md` — riferisce S111
   (grafo/compatibility), S112 (nodi Node-RED), S113 (compiler/deploy/diagnostica).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S111/S112/S113 per ogni operazione descritta, non una
  spiegazione generica.

## Fine task

- [x] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [x] La riga "Cross-Core Automation" in `UX_ARCHITECTURE.md` passa a "✅".

## Implementazione (2026-08-12)

Scritti `ux/screens/S110-cross-core-automation/{visual.md,ui-behavior.md,backend-behavior.md}`.
Decisione centrale motivata esplicitamente: i nodi sono colorati per **Core
proprietario** (palette rotazionale a 6 colori), non per categoria di
comportamento come in S070 — icona/forma distingue invece record field/command/
Node-RED processing. Trasformazione esplicita obbligatoria per edge fra schemi
incompatibili (mai conversione implicita), link stale dopo catalog change con
stile tratteggiato dedicato e azione "Rivalida", tab Deploy con banner di scope
sempre visibile e classificazione IN_SYNC/DIVERGED riusata da `UX-S030`,
diagnostica end-to-end a breadcrumb con isolamento per tappa offline.
`backend-behavior.md` cita S111/S112/S113 punto per punto (tutte ⬜ TODO).

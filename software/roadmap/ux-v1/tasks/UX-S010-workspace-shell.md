# UX-S010 — Project/Workspace Shell

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S011–S014

## Obiettivo

Specificare la schermata iniziale: elenco progetti/workspace, creazione, import/export,
e le affordance globali di undo/redo — con lo stesso dettaglio di
`ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Elenco progetti nel workspace (`Workspace.projects[]`), stato vuoto per un workspace
  senza progetti, azione di creazione di un nuovo progetto (`createEmptyProject`).
- Import/export di un progetto (`.json`) — nessun segreto nell'export (S121, ancora da
  scrivere: qui basta rappresentare l'azione, non la redaction).
- Affordance visibili di undo/redo (icone/scorciatoie `⌘Z`/`⌘⇧Z`) coerenti col
  `CommandStack` — stato disabilitato quando `canUndo()`/`canRedo()` sono falsi.
- Command palette (`⌘K`) menzionata in `UX_ARCHITECTURE.md` § Convenzioni
  cross-cutting: cosa mostra, come si naviga.
- Selezione del progetto attivo — questo è ciò che popola "Core attivo" nella top bar
  descritta in `UX_ARCHITECTURE.md` § Shell applicativa.

## Implementazione richiesta

1. `ux/screens/S010-workspace-shell/visual.md`
2. `ux/screens/S010-workspace-shell/ui-behavior.md`
3. `ux/screens/S010-workspace-shell/backend-behavior.md` — riferisce
   `createEmptyProject`, `ProjectRepository` (S014), `CommandStack` (S014).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita le funzioni/task reali già esistenti (S014) per ogni
  operazione descritta.

## Fine task

- [x] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [x] La riga "Project/Workspace Shell" in `UX_ARCHITECTURE.md` passa a "✅".

## Implementazione (2026-08-12)

Scritti `ux/screens/S010-workspace-shell/{visual.md,ui-behavior.md,backend-behavior.md}`.
Il task copre due superfici distinte: il project picker pre-apertura (senza la shell
a tre colonne, dato che non esiste ancora un Core attivo) e l'estensione della top bar
standard (undo/redo + command palette) visibile dentro un progetto aperto.
`backend-behavior.md` nota un limite reale non risolto da questo task:
`ProjectRepository` non ha un metodo "list con metadati leggeri", quindi popolare la
griglia di progetti richiede caricare ogni progetto per intero.

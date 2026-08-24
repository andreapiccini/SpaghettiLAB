# UI-S010 — Shell applicativa, Project Picker, undo/redo, command palette

**Stato:** ✅ DONE
**Spec UX:** [UX-S010](../../ux-v1/tasks/UX-S010-workspace-shell.md) ·
[visual](../../../ux/screens/S010-workspace-shell/visual.md) ·
[ui-behavior](../../../ux/screens/S010-workspace-shell/ui-behavior.md) ·
[backend-behavior](../../../ux/screens/S010-workspace-shell/backend-behavior.md)
**Pacchetti backend:** `domain` (S014's `createEmptyProject`/`importProjectV1`/
`CommandStack`), `project-store` (S014's `ProjectRepository`)

## Obiettivo

Prima schermata reale dell'app: il Project Picker (nessun progetto aperto) e
l'estensione della top bar standard (undo/redo, command palette) dentro un progetto
aperto — la fondazione condivisa (Tailwind/Motion/Lucide/font/shell a tre colonne) da
cui ogni altra schermata di `roadmap/app-v1` parte.

## Implementazione richiesta

1. Fondazioni condivise: Tailwind configurato sui token di `UX_ARCHITECTURE.md`,
   Motion for React, Lucide, font Manrope/Noto Sans, componente di shell a tre
   colonne (top bar/left rail/inspector) riusabile dalle schermate successive.
2. Project Picker: stati vuoto/caricamento/errore/popolato, ricerca client-side,
   creazione nuovo progetto (dialogo + validazione locale), import.
3. Estensione top bar: pulsanti undo/redo cablati a `CommandStack`, con tooltip che
   legge `peekUndoKind()`/`peekRedoKind()`.
4. Command palette (`⌘K`): overlay con navigazione fra schermate e azioni
   disponibili nel contesto corrente.

## Gap reale trovato e corretto durante l'implementazione

`backend-behavior.md` assume che `CommandStack` "conservi il comando, non solo lo
snapshot" per popolare il tooltip di undo/redo — il codice reale prima di questo task
conservava solo gli snapshot `ProjectV1`. Aggiunti `peekUndoKind()`/`peekRedoKind()` a
`packages/domain/src/commands.ts`, con test, prima di costruire la UI che li usa.

## Fine task

- [x] Tailwind/Motion/Lucide/font configurati, shell a tre colonne come componente
      condiviso.
- [x] Project Picker raggiungibile e funzionale con tutti e quattro gli stati.
- [x] Creazione ed import progetto cablati a `ProjectRepository`/`importProjectV1`
      reali, non dati finti.
- [x] Undo/redo in top bar cablati a `CommandStack` reale, tooltip con descrizione.
- [x] Command palette funzionante da tastiera, nessun mouse necessario per l'intero
      ciclo.

## Implementazione (2026-08-14)

**Fondazioni** (`packages/app`): Tailwind v4 (`@tailwindcss/vite`, token in
`src/index.css` via `@theme` — colori/radius/shadow/font da `UX_ARCHITECTURE.md`,
nomi CSS `--radius-slsm`/`--shadow-e1` ecc. tenuti letterali come da spec), Motion for
React (`motion` npm, token spring/duration in `src/lib/motion-tokens.ts`), Lucide
React, font Manrope+Noto Sans via `@fontsource`. Adapter browser reali per i port di
`domain`: `LocalStorageAdapter` (`Storage`, namespaced `spaghettilab:`) e
`BrowserUuidGenerator` (`UuidGenerator`, `crypto.randomUUID()`).

**Project Picker** (`components/project-picker/`): tutti e quattro gli stati
(vuoto con glow decorativo, caricamento skeleton, errore con Riprova, popolato con
ricerca client-side) cablati a `ProjectRepository`/`importProjectV1` reali — nessun
dato finto. Verificato dal vivo nel browser: creazione progetto → persistenza
`localStorage` reale (JSON `ProjectV1` valido verificato via devtools) → reload pagina
→ progetto ricompare nella griglia → riapertura funzionante.

**Shell + top bar + command palette** (`components/shell/`): `AppShell` a tre colonne,
`LeftRail` con le tre sezioni/separatori di `UX_ARCHITECTURE.md`, `TopBar` con
undo/redo cablati a `CommandStack` reale (tooltip da `peekUndoKind()`/
`peekRedoKind()`, vedi gap sotto), `CommandPalette` con `⌘K`, navigazione da tastiera
(frecce/Invio/Escape), voci di azione condizionate a `canUndo()`/`canRedo()`.

**Gap reale trovato e corretto**: `backend-behavior.md` assumeva che `CommandStack`
conservasse il comando (non solo lo snapshot) per il tooltip undo/redo — non era
vero. Aggiunti `peekUndoKind()`/`peekRedoKind()` a `packages/domain/src/commands.ts`
con test, prima di costruire la UI che li usa.

**Le altre 10 schermate restano `ScreenStub` onesti** ("Non ancora implementata —
vedi UI-S0NN"), mai dati finti — la navigazione della left rail/command palette le
raggiunge già tutte, pronte per essere sostituite una alla volta dai task successivi.

**Scope onestamente incompleto**: nessun test automatizzato (Vitest+Testing Library)
per i componenti React di questo task — solo verifica manuale nel browser reale
documentata sopra; import da file non ancora testato con un payload realmente
malformato nel browser (solo a livello di unit test `domain`); bundle font più
pesante del necessario (`@fontsource` importa tutti i subset unicode, non solo
latino) — ottimizzazione non bloccante, rimandata.

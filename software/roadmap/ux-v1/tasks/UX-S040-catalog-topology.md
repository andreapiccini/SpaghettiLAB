# UX-S040 — Catalog & Topology Explorer

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S041–S043

## Obiettivo

Specificare come si esplorano catalogo e topologia di un Core — puramente
diagnostico/informativo, nessuna modifica qui — con lo stesso dettaglio di
`ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Vista del catalogo normalizzato: Module Driver, Rule, Block, opcode, Profile,
  Capability Pack — organizzati per tipo, con badge di versione/compatibilità.
- Vista della topologia: Flow, Port, Function Bay, rail — senza GPIO hardcoded (il
  design non deve mai mostrare un numero di pin fisso, solo ciò che il Core dichiara).
- Placeholder diagnostico per un tipo mancante/sconosciuto: cosa vede l'utente, quale
  remediation gli viene proposta (installare un pack, aggiornare il firmware).
- Stato "catalogo/topologia parziali" (lettura interrotta) — deve essere
  distinguibile da "vuoto per davvero", mai presentato come completo.
- Come questa schermata si collega concettualmente alla Palette del Processing Graph
  Editor (stessa fonte dati, l'`EditorModel`).

## Implementazione richiesta

1. `ux/screens/S040-catalog-topology/visual.md`
2. `ux/screens/S040-catalog-topology/ui-behavior.md`
3. `ux/screens/S040-catalog-topology/backend-behavior.md` — riferisce S041
   (normalizzazione), S042 (`EditorModel`), S043 (adapter).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S041/S042/S043 per ogni dato mostrato, non una
  spiegazione generica.

## Fine task

- [x] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [x] La riga "Catalog & Topology Explorer" in `UX_ARCHITECTURE.md` passa a "✅".

## Implementazione (2026-08-12)

Scritti `ux/screens/S040-catalog-topology/{visual.md,ui-behavior.md,backend-behavior.md}`.
Vista sola lettura su due tab (Catalogo/Topologia), placeholder diagnostico per tipi
sconosciuti che preserva i dati invece di cancellarli, banner esplicito per letture
parziali distinto dallo stato vuoto reale, nessun GPIO/numero di pin hardcoded.
`backend-behavior.md` collega esplicitamente questa vista allo stesso `EditorModel`
(S042) usato dalla Palette del Processing Graph Editor (S070) — stessa fonte dati,
presentazione sola lettura qui.

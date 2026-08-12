# UX-S080 — Deploy & Diff

**Stato:** ⬜ TODO
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S080

## Obiettivo

Specificare la schermata dove un Config viene validato, confrontato e applicato in
sicurezza — con lo stesso dettaglio di `ux/screens/S070-processing-graph-editor/`. È
la destinazione del pulsante "Invia a Deploy" del Processing Graph Editor.

## Cosa deve coprire

- Diff semantico fra live, ultimo deployato e candidato — per Module/Profile/
  Schedule/Rule/Block/edge/policy, ignorando metadata di authoring. Come si
  rappresenta visivamente un "aggiunto/rimosso/modificato" per ciascun tipo di
  entità.
- La pipeline compile → validate locale → risoluzione artifact → validate remota →
  apply CAS → verifica read-back — resa come una sequenza di stati chiari, non una
  singola barra di progresso indifferenziata.
- Gestione del conflitto (`CONFLICT`): tre azioni esplicite (importa stato live,
  rebase/merge strutturato, annulla) — mai un pulsante "sovrascrivi e basta".
- Deploy multi-Core come operazioni indipendenti con report per-target — un
  fallimento su un Core non deve far sembrare falliti gli altri.
- Cosa succede se profili/pack richiesti non sono installati: blocco del deploy con
  link diretto a Device Profile Studio (S060) o Capability Marketplace (S100).

## Implementazione richiesta

1. `ux/screens/S080-deploy-diff/visual.md`
2. `ux/screens/S080-deploy-diff/ui-behavior.md`
3. `ux/screens/S080-deploy-diff/backend-behavior.md` — riferisce S080 (Deployment
   Coordinator).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S080 per ogni fase della pipeline descritta, non una
  spiegazione generica.

## Fine task

- [ ] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [ ] La riga "Deploy & Diff" in `UX_ARCHITECTURE.md` passa a "✅".

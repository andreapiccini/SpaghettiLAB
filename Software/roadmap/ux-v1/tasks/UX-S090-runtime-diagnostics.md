# UX-S090 — Runtime & Diagnostics

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S091–S094

## Obiettivo

Specificare come si osserva un Core live — telemetria, comandi, discovery, salute e
risorse — con lo stesso dettaglio di `ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Vista telemetria: record/eventi con provenienza, boot ID, sequence, gap sempre
  visibili — mai una serie temporale che nasconde una discontinuità.
- Command runner: forma tipizzata per comando catalogato, e come si distingue
  visivamente e concettualmente da una modifica Config (colore/etichetta dedicati,
  mai lo stesso stile del pulsante "Invia a Deploy" di S080).
- Discovery: scan/list/accept/reject, avviso esplicito per una policy invasiva prima
  di avviarla.
- Resource monitor: flash/image headroom, RAM statica, pool/workspace/stack
  capacity-current-peak — come grandezze distinte, mai sommate in un solo numero
  (coerente con S093, non un'unica barra "memoria disponibile").
- Operazioni amministrative (connectivity/lease/maintenance/reset) con conferma
  target-specific per ogni azione distruttiva (S094).

## Implementazione richiesta

1. `ux/screens/S090-runtime-diagnostics/visual.md`
2. `ux/screens/S090-runtime-diagnostics/ui-behavior.md`
3. `ux/screens/S090-runtime-diagnostics/backend-behavior.md` — riferisce S091
   (telemetria), S092 (comandi/discovery), S093 (stato/risorse), S094 (admin ops).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S091/S092/S093/S094 per ogni dato/azione descritti, non
  una spiegazione generica.

## Fine task

- [x] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [x] La riga "Runtime & Diagnostics" in `UX_ARCHITECTURE.md` passa a "✅".

## Implementazione (2026-08-12)

Scritti `ux/screens/S090-runtime-diagnostics/{visual.md,ui-behavior.md,backend-behavior.md}`.
Cinque tab (Telemetria/Comandi/Discovery/Stato & Risorse/Amministrazione). Regola
cross-cutting esplicita: ogni azione live (comando/discovery/admin) usa l'accento
`color.brand.purple-glow`, mai `color.brand.blue` riservato alle azioni Config —
distingue strutturalmente comando immediato da modifica persistente. Gap/boot ID/
sequence sempre visibili in telemetria, mai una serie continua che nasconde una
discontinuità. Resource monitor con card separate per grandezza (mai sommate).
`backend-behavior.md` cita S091/S092/S093/S094 punto per punto (tutte ⬜ TODO).

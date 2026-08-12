# UX-S100 — Capability Marketplace & OTA

**Stato:** ⬜ TODO
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S101–S103

## Obiettivo

Specificare come si risolve una feature firmware mancante tramite un pack e come si
segue un aggiornamento firmware — con lo stesso dettaglio di
`ux/screens/S070-processing-graph-editor/`.

## Cosa deve coprire

- Ricerca/sfoglio del marketplace, con available/installed/required tenuti
  visivamente distinti (non un'unica lista indifferenziata).
- Dependency resolver: ogni scelta/conflitto/incompatibilità mostrata con la sua
  motivazione — mai un semplice "non compatibile" senza spiegazione.
- Preflight: confronto flash/RAM/stack/pool fra manifest e capacità build, con
  delta/margini espliciti — mai la RAM libera istantanea come prova di compatibilità.
- La state machine OTA per intero, come sequenza di stati chiari: arm → upload →
  progress → finalize → reboot → trial → confirm/rollback — l'utente deve sempre
  sapere se il Core è ancora nello stato precedente o già in quello nuovo (in prova).
- Cosa vede l'utente durante un rollback — deve essere rassicurante, non allarmante:
  il Config e i profili sono preservati.

## Implementazione richiesta

1. `ux/screens/S100-capability-marketplace/visual.md`
2. `ux/screens/S100-capability-marketplace/ui-behavior.md`
3. `ux/screens/S100-capability-marketplace/backend-behavior.md` — riferisce S101
   (marketplace/resolver), S102 (preflight), S103 (state machine OTA).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` cita S101/S102/S103 per ogni fase descritta, non una
  spiegazione generica.

## Fine task

- [ ] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [ ] La riga "Capability Marketplace & OTA" in `UX_ARCHITECTURE.md` passa a "✅".

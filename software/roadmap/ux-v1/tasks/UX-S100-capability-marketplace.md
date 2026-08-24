# UX-S100 — Capability Marketplace & OTA

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` (nessuna dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** S101–S104, S063

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

- [x] I tre file esistono e seguono il formato di `S070-processing-graph-editor`.
- [x] La riga "Capability Marketplace & OTA" in `UX_ARCHITECTURE.md` passa a "✅".

## Implementazione (2026-08-12)

Scritti `ux/screens/S100-capability-marketplace/{visual.md,ui-behavior.md,backend-behavior.md}`.
Tre tab (Marketplace/Preflight/Aggiornamento). Marketplace con tre liste
esplicitamente separate (Disponibili/Installati/Richiesti dal progetto) e
dependency resolver con motivazione testuale sempre presente per ogni esito.
Preflight con tabella budget a tre colonne (richiesto/capacità/margine, mai RAM
libera istantanea). OTA con stepper a 8 tappe riusando lo stile di `UX-S080`,
indicatore doppio versione stabile/in prova sempre visibile durante il trial, e
banner di rollback deliberatamente rassicurante (`color.info`, mai `color.error`).
`backend-behavior.md` cita S101/S102/S103 punto per punto (tutte ⬜ TODO).

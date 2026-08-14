# D010 — Architettura e confini

**Stato:** ⬜ TODO
**Dipende da:** —
**Blocca:** D011, D020, D030

## Obiettivo

Congelare: dashboard = **motore grafico di presentazione**; viste/animazioni
estendibili (marketplace + developer); automazioni fuori.

## Implementazione richiesta

1. Approva:
   - `DASHBOARD_ARCHITECTURE.md`
   - `design/THEMING.md`
   - `design/VIEW_MODES.md`
2. Verifica esplicito:
   - focus prodotto = grafica / ViewMode / Visual Pack;
   - nessuna regola SE/ALLORA in fase 1;
   - pack scaricabili + creabili da chi programma (due canali);
   - sicurezza: no eval Dart remoto (asset-driven / plugin firmati).
3. Allinea confini con React Flow e Node-RED.

## Verifiche

- domain senza `Rule`;
- `HOST_API` senza endpoint automazione;
- ViewMode/Scene/VisualPack presenti nel modello documentale.

## Fine task

- [ ] Tre documenti approvati.
- [ ] Tabella schermate + roadmap D200 bozza coerenti.

# D051 — Schermate collegate al fake host

**Stato:** ⬜ TODO
**Dipende da:** D021–D029, D027, D028, D040, D050

## Obiettivo

Implementare tutte le schermate — focus **grafica e personalizzazione**.

## Implementazione richiesta

1. Schermate D021–D029, D027, D028 per spec UX.
2. Widget `AnimatedStateWidget` (pompa minimo: icona + rotation animation).
3. Canvas via `ViewRendererRegistry` → `CardsRenderer` only.
4. Appearance editor con preview; marketplace apply Visual Pack.
5. Repository sottile; no logica automazione in UI.

## Verifiche

- demo: connect → canvas pompa+temperature → appearance cambia colori → marketplace
  apply "Garden" → pompa toggle da point-detail;
- nessuna schermata automazioni;
- `flutter test` su theme override e animated widget state.

## Fine task

- [ ] 9 schermate implementate.
- [ ] Checklist D080 aggiornata.

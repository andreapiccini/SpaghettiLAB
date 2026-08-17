# D029 — Marketplace Visual Pack (shell)

**Stato:** ✅ DONE
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/marketplace/`

## Obiettivo

Shell browse **Visual Pack** (non solo colori): anteprima, view modes supportati,
tap Applica. Fase 1 fake; pagamento e pack developer reali = D240/D250.

## Cosa deve coprire

- Card pack: thumbnail, nome, tag (`Cards`, `Industrial`, `Garden`), badge
  `supportedViewModes` (anche se runtime applica solo appearance + cards).
- Dettaglio: preview, “include tema / layout / (teaser) scena top_down”.
- CTA **Applica** → conferma → canvas aggiornato.
- Copy: “Crea i tuoi pack se programmi — SDK in arrivo” (link placeholder).
- Nessun pagamento fase 1.

## Implementazione richiesta

1. `visual.md` / `ui-behavior.md` / `host-behavior.md`
2. Host: `GET visual-packs`, `POST apply-pack`

## Fine task

- [x] Tre file spec.
- [x] Spec allineata a `VIEW_MODES.md` (due canali: marketplace + developer).

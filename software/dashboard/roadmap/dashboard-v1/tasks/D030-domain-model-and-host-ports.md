# D030 — Modello dominio e porte Host

**Stato:** ✅ DONE
**Dipende da:** D010, D011
**Blocca:** D031, D040, D051

## Obiettivo

Domain Dart puro orientato alla **grafica**: points, layout, appearance, view
preset, visual pack. **Nessuna automazione.**

## Implementazione richiesta

1. Modelli:
   - `System`, `ExposurePoint` (+ `visualHint`, `visualStates`)
   - `DashboardLayout`, `DashboardWidget`
   - `DashboardAppearance`, `BackgroundSpec`, `AnimationProfile`, `BrandSpec`
   - `ViewModeKind`, `ViewPreset` (fase 1: kind=cards)
   - `Scene`, `SceneNode`, `SceneEdge` (tipi presenti anche se unused in UI)
   - `VisualPack`, `VisualPackSummary`
   - `SystemCapabilities` incl. `customViews`, `marketplace`, …
2. `HostPort`: systems, points, layout, appearance, view get/put, marketplace,
   commands, stream — **no** rules.
3. Test: appearance merge; ViewPreset default cards; pack summary parse.

## Verifiche

- zero Flutter UI nel domain package;
- tipi Scene/ViewPreset esistono (forward-compat);
- README: "automazioni fuori; viste estendibili".

## Fine task

- [ ] Modelli + porta + test.

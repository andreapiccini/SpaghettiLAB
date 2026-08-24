# D050 — Shell navigazione e routing

**Stato:** ✅ DONE
**Dipende da:** D011
**Blocca:** D051

## Obiettivo

Router + **ThemeProvider** che applica `DashboardAppearance` globalmente.

## Implementazione richiesta

1. Routes: connect, overview, canvas, appearance, marketplace, settings, modali
   picker/detail.
2. `ThemeProvider` / inherited widget: legge appearance da host, rebuild theme Material.
3. Nav: bottom bar default; switch a rail se `menuStyle=rail`.
4. Background layer su canvas route (gradient/image da appearance).

## Verifiche

- cambio appearance in editor → canvas si aggiorna senza restart;
- kiosk mode nasconde entry modifica/marketplace se capability.

## Fine task

- [ ] Router + theme engine base.
- [ ] Placeholder per D051.

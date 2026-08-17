# Roadmap Dashboard SpaghettiLAB — Fase 1 (motore grafico + cards)

[Indice master Software](../../../SOFTWARE_MASTER_INDEX.md) ·
[Architettura](../../DASHBOARD_ARCHITECTURE.md) ·
[View modes](../../design/VIEW_MODES.md) ·
[Theming](../../design/THEMING.md) ·
[HOST_API](../../HOST_API.md)

## Obiettivo fase 1

Costruire il **motore di presentazione** Flutter con ViewMode `cards`, appearance,
animazioni e shell marketplace — lasciando **aperto** il modello Scene / Visual Pack
/ viste libere (schematic, top_down, first_person, custom) senza implementarle ancora.

Focus prodotto: **grafica**. Automazioni = fuori (Node-RED / Config).

## Fasi

| Stato | Task | Risultato |
|---|---|---|
| | **D010 — Fondazioni** | |
| ✅ | [D010 — Architettura e confini](tasks/D010-architecture-and-boundaries.md) | Grafica first; viste estendibili documentate. |
| | **D011 — Workspace** | |
| ✅ | [D011 — Scaffold Flutter + Docker/FVM + theme](tasks/D011-flutter-workspace-and-design-system.md) | App + CI container + dev web. |
| | **D020 — Spec UX** | |
| ✅ | [D020 — Inventario schermate](tasks/D020-screen-inventory-and-spec-format.md) | |
| ✅ | [D021 — Connect](tasks/D021-connect-system-selection.md) | |
| ✅ | [D022 — Overview](tasks/D022-system-overview.md) | |
| ✅ | [D023 — Canvas cards](tasks/D023-dashboard-canvas.md) | Widget + animazioni. |
| ✅ | [D024 — Widget picker](tasks/D024-widget-picker.md) | |
| ✅ | [D025 — Point detail](tasks/D025-point-detail-control.md) | |
| ✅ | [D026 — Appearance](tasks/D026-appearance-theme-editor.md) | |
| ✅ | [D029 — Marketplace Visual Pack (shell)](tasks/D029-marketplace-theme-shell.md) | Browse/apply pack. |
| ✅ | [D027 — Settings](tasks/D027-settings-display-modes.md) | |
| ✅ | [D028 — Stati](tasks/D028-cross-cutting-states.md) | |
| | **D030 — Dominio** | |
| ✅ | [D030 — Dominio + HostPort](tasks/D030-domain-model-and-host-ports.md) | Appearance, ViewPreset, VisualPack; no Rule. |
| ✅ | [D031 — Registry renderer (hook)](tasks/D031-view-renderer-registry.md) | Interfaccia pluggable; solo CardsRenderer. |
| ✅ | [D040 — Fake host](tasks/D040-fake-host-fixtures.md) | Pompa + pack fake. |
| | **D050 — App** | |
| ✅ | [D050 — Shell + ThemeProvider](tasks/D050-app-shell-navigation.md) | |
| ✅ | [D051 — Schermate + fake](tasks/D051-screens-wired-to-fake-host.md) | |
| | **D070 — Chiusura** | |
| ✅ | [D070 — HOST_API freeze](tasks/D070-host-api-freeze.md) | V1 2026-08-16 |
| ✅ | [D080 — Gate fase 1](tasks/D080-phase1-validation-gate.md) | |

## Dopo fase 1 — [fase 2 viste](../dashboard-v2/README.md)

| Task | Tema |
|---|---|
| ✅ D200 | Scene model + binding editor (placement 2D) |
| ✅ D210 | Renderer `schematic` |
| ✅ D220 | Renderer `top_down` |
| D230 | Renderer `first_person` stilizzato (Rive / 2.5D) |
| D240 | Visual Pack SDK developer + publish locale |
| D250 | Marketplace reale (free/paid) + firma pack |
| D110–D130 | Adapter Protocol V1, edge host, cloud |

## Dipendenze

```text
D010 → D011, D020, D030
D020 → D021…D029
D030 → D031 → D040 → D051
D011, D050 → D051 → D070 → D080
```

## Gate fase 1

App navigabile; pompa animata; appearance; marketplace shell; **registry renderer**
con solo `cards` ma API pronta; `VIEW_MODES.md` approvato; nessuna automazione in app.

# Specifiche UX — Dashboard

[Architettura](../DASHBOARD_ARCHITECTURE.md) ·
[Theming](../design/THEMING.md) ·
[Roadmap](../roadmap/dashboard-v1/README.md)

## Focus

Dashboard = **motore grafico**: look, motion, layout, viste (fase 1: cards).
Viste avanzate e Visual Pack: vedi `design/VIEW_MODES.md`.
Automazioni (Telegram, Node-RED) **non** hanno schermata dedicata.

## Formato

Tre file per schermata in `ux/screens/<slug>/`:

| File | Contenuto |
|---|---|
| `visual.md` | Layout, widget, animazioni, token + override tema |
| `ui-behavior.md` | Interazioni locali — nessuna rete |
| `host-behavior.md` | `HOST_API.md` — points, appearance, layout |

## Schermate fase 1

| Slug | Task | Stato |
|---|---|---|
| [connect](screens/connect/) | D021 | ⬜ |
| [overview](screens/overview/) | D022 | ⬜ |
| [canvas](screens/canvas/) | D023 | ⬜ |
| [widget-picker](screens/widget-picker/) | D024 | ⬜ |
| [point-detail](screens/point-detail/) | D025 | ⬜ |
| [appearance](screens/appearance/) | D026 | ⬜ |
| [marketplace](screens/marketplace/) | D029 | ⬜ |
| [settings](screens/settings/) | D027 | ⬜ |
| [states](screens/states/) | D028 | ⬜ |

## Regole

- Copy italiano neutro (fabbrica e maker stesso linguaggio visivo).
- Non menzionare MQTT, Node-RED, Telegram nelle spec **visual** (solo settings link).
- Widget animati reagiscono a **valori/stream**, non a logica inventata in UI.

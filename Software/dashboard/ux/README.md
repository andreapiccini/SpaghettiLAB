# Specifiche UX — Dashboard

[Architettura](../DASHBOARD_ARCHITECTURE.md) ·
[Theming](../design/THEMING.md) ·
[Token](../design/DESIGN_TOKENS.md) ·
[Roadmap](../roadmap/dashboard-v1/README.md)

## Focus

Dashboard = **motore grafico**: look, motion, layout, viste (fase 1: cards).
Viste avanzate e Visual Pack: vedi `design/VIEW_MODES.md`.
Automazioni (Telegram, Node-RED) **non** hanno schermata dedicata.

## Formato

Tre file per schermata in `ux/screens/<slug>/`:

| File | Contenuto |
|---|---|
| `visual.md` | Layout, widget, animazioni, **solo** token di `DESIGN_TOKENS.md` + override `THEMING.md` |
| `ui-behavior.md` | Interazioni locali — nessuna rete, niente MQTT |
| `host-behavior.md` | Solo `HOST_API.md` — points, appearance, layout, stream |

Ogni `visual.md` cita i token per nome (`color.bg.surface`, `type.display`, `motion.normal`).

## Schermate fase 1

| Slug | Task | Stato |
|---|---|---|
| [connect](screens/connect/) | D021 | ✅ spec |
| [overview](screens/overview/) | D022 | ✅ spec |
| [canvas](screens/canvas/) | D023 | ✅ spec |
| [widget-picker](screens/widget-picker/) | D024 | ✅ spec |
| [point-detail](screens/point-detail/) | D025 | ✅ spec |
| [appearance](screens/appearance/) | D026 | ✅ spec |
| [marketplace](screens/marketplace/) | D029 | ✅ spec |
| [settings](screens/settings/) | D027 / E051 | ✅ spec |
| [states](screens/states/) | D028 | ✅ spec |
| [login](screens/login/) | E050 | ✅ spec |
| [select-site](screens/select-site/) | E050 | ✅ spec |

**Non presente:** `automations`.

## Regole

- Copy italiano neutro (fabbrica e maker stesso linguaggio visivo).
- Non menzionare MQTT, Node-RED, Telegram nelle spec **visual** (solo settings, link informativo).
- Widget animati reagiscono a **valori/stream**, non a logica inventata in UI.

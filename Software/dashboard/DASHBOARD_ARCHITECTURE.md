# Architettura Dashboard SpaghettiLAB

[React Flow (ingegneria)](../REACT_FLOW_ARCHITECTURE.md) ·
[Deployment & accessi](../DEPLOYMENT_ACCESS_MODEL.md) ·
[Theming](design/THEMING.md) ·
[View modes & Visual Pack](design/VIEW_MODES.md) ·
[Roadmap dashboard](roadmap/dashboard-v1/README.md)

## Scopo (prodotto finale)

La Dashboard è il **volto grafico** di SpaghettiLAB: ciò che gira sotto (firmware,
Protocol V1, React Flow, Node-RED) ha valore tecnico; il prodotto che l’utente
**vede e paga** è un’interfaccia bella, organizzata e **estendibile** — temi,
animazioni, viste (cards, schema macchina, pianta dall’alto, first person, …)
da marketplace o create da chi sa programmare.

Non crea logica. Non esegue automazioni. Non configura moduli. **Presenta** e
permette comandi manuali su punti già esposti.

| Dove vive la logica | Esempi |
|---|---|
| **Firmware / Config** (React Flow → deploy) | processing bounded, regole sul Core |
| **Node-RED** (edge o cloud) | Telegram, integrazioni, "se messaggio → accendi pompa" |
| **Dashboard** | temperatura, pompa che gira, serra in top-down, schema turbina, tema aziendale |

Non è Arduino Cloud (layout fisso vendor). Non è React Flow. Non è Node-RED.
Non aggiunge operazioni Protocol V1 al firmware.

## Prodotto turnkey e ruoli

Oltre all'ecosistema DIY, la dashboard partecipa al **Site Package** consegnato al
cliente (stack on-prem + UI già configurata). Ruoli (viewer, operator, site_admin,
partner, support grant) e accesso remoto sicuro:
[`DEPLOYMENT_ACCESS_MODEL.md`](../DEPLOYMENT_ACCESS_MODEL.md) · roadmap
[`ecosystem-access-v1`](../roadmap/ecosystem-access-v1/README.md).

Fase 1 UI aveva **nessun login**; da E050 la shell è role-aware (`HOST_IDENTITY_API.md`).

## Confini del sistema

```text
React Flow
  └── ingegneria: moduli, processing, exposure

Node-RED (+ host)
  └── automazioni e integrazioni → aggiornano ExposurePoint

Dashboard Host
  └── points, comandi, appearance, layout, visual packs
  └── NON esegue regole per la UI

Dashboard Flutter
  └── motore di presentazione: ViewMode + Renderer + Appearance
  └── marketplace Visual Pack (shell → reale)
  └── zero MQTT, CBOR, Node-RED, Telegram

Core firmware
  └── Protocol V1 generico — nessuna API dashboard
```

### Esempio (Telegram + serra)

1. Node-RED gestisce Telegram e comandi pompa/irrigazione.
2. Host espone punti (`salotto.temperatura`, `serra.vaso_3.umidita`, `giardino.pompa`).
3. Utente applica pack **Greenhouse** (top_down) o resta su **cards**; la pompa
   anima quando `visualState=running`. La dashboard non conosce Telegram.

## Principi non negoziabili

1. **Grafica first** — il focus prodotto della dashboard è presentazione e viste.
2. **Mostra, non automatizza** — logica fuori; UI solo rendering + tap comando.
3. **Viste libere** — ViewMode/Scene/Visual Pack estendibili (marketplace + developer).
4. **Visione di sistema** — `ExposurePoint` umano, non catalogo grezzo.
5. **UI prima, integrazione dopo** — fase 1 = cards + appearance + fake host.
6. **Stesso client** — un Flutter; edge/cloud/mobile differiscono per host/licenza.

## Modello dati (UI-neutral)

```text
System
  systemId, name, connectionState, lastSeen

ExposurePoint
  pointId, label, kind, valueType, unit
  visualHint, visualStates[], writable?, commandPointId?

DashboardLayout                 ← usato da ViewMode cards (fase 1)
  pages[] { widgets[], … }

Scene                           ← usato da schematic / top_down / first_person
  nodes[], edges?, cameras?     ← vedi VIEW_MODES.md

ViewPreset
  viewId, kind (cards|schematic|top_down|first_person|custom)
  sceneRef?, layoutRef?, packRef?

DashboardAppearance
  colors, background, animationProfile, brand, menuStyle, …

VisualPackRef
  packId, version, source (marketplace|local|org|developer)

DisplayMode
  normal | kiosk | compact
```

Il dominio **non** contiene: regole automazione, MQTT, Node-RED, Protocol V1 IDs.

## Schermate fase 1

| Schermata | Slug | Ruolo | Spec |
|---|---|---|---|
| Connessione | `connect` | Host/sistema | ✅ |
| Panoramica | `overview` | Stato + accesso rapido | ✅ |
| Canvas | `canvas` | ViewMode `cards` + animazioni | ✅ |
| Widget picker | `widget-picker` | Punto → widget | ✅ |
| Dettaglio punto | `point-detail` | Valore + comando | ✅ |
| Aspetto | `appearance` | Tema / sfondo / motion | ✅ |
| Marketplace | `marketplace` | Browse/apply Visual Pack (shell) | ✅ |
| Impostazioni | `settings` | Kiosk, about | ✅ |
| Stati | `states` | Vuoto / offline / errore | ✅ |

Switcher ViewMode (schematic / top_down / …) = **fase 2+** (hook UI in overview/canvas).

## Design

- `design/DESIGN_TOKENS.md` — token base  
- `design/THEMING.md` — appearance e brand  
- `design/VIEW_MODES.md` — viste, scene, Visual Pack, sicurezza pack  

## Gate fase 1 (D080) — chiuso 2026-08-16

- Spec + implementazione schermate fase 1 con fake host
- Widget animato (pompa)
- Appearance editabile
- Marketplace shell (pack fake, almeno uno “visual”)
- Documentato: ViewMode estendibili (anche se runtime = solo `cards`)
- Build web in Docker CI; nativo via FVM documentato in `ENVIRONMENT.md`
- [`HOST_API.md`](HOST_API.md) **V1** congelata

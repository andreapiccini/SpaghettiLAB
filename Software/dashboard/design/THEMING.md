# Dashboard — Theming e Visual Pack

[Design tokens](DESIGN_TOKENS.md) ·
[View modes](VIEW_MODES.md) ·
[Architettura](../DASHBOARD_ARCHITECTURE.md)

## Scopo

La dashboard non è un template fisso. Ogni installazione può avere aspetto e
**tipo di vista** diversi: cards maker, schema industriale, pianta serra,
kiosk brandizzato.

**Fase 1:** appearance + ViewMode `cards` + marketplace shell.  
**Fase 2+:** Visual Pack completi (scene, renderer, marketplace, SDK developer).

## Livelli di personalizzazione

| Livello | Cosa controlla | Fase |
|---|---|---|
| **Theme / Appearance** | Colori, tipografia, sfondo, brand | 1 |
| **Layout cards** | Griglia widget, pagine, menu | 1 |
| **Widget visual + animazioni** | gauge, animated Rive/Lottie, stati | 1 |
| **ViewMode** | cards / schematic / top_down / first_person / custom | 1 hook, 2 runtime |
| **Scene** | Nodi, posizioni, edge, camere, binding punti | 2 |
| **Visual Pack** | Bundle appearance + scene + assets + renderer | 2 |
| **Marketplace** | Catalogo pack (free / paid / org) | 1 shell, 2 reale |
| **Developer SDK** | Creazione pack da chi programma | 2 |

## Appearance (fase 1)

Override su `DESIGN_TOKENS.md`:

```text
colors.*, type.display.scale, radius.*
animationProfile (subtle | standard | rich)
background { solid | gradient | imageRef }
brand.logoRef?, menuStyle
```

Preview live: `PUT appearance` → stream `appearance_updated`.

## Widget e animazioni (cards)

| `visualHint` | Comportamento |
|---|---|
| `gauge` / `value` / `switch` / `button` / `status` / `sparkline` | Builtin |
| `animated` | Asset Lottie/Rive per `visualStates` (idle/running/fault) |

La dashboard **non** decide quando gira la pompa: legge `visualState` dall’host.

## Visual Pack (unità di estensione)

Un pack può includere solo tema **oppure** tema + scene + view modes:

```text
VisualPack
  packId, name, author, version
  appearance?
  scenes[]?
  defaultViewMode, supportedViewModes[]
  assets[]
  renderer: { type: builtin | asset_driven | dart_plugin, … }
  requiredCapabilities[]
```

### Creazione libera (due porte)

1. **Marketplace** — scarica/applica (utente finale).
2. **Developer** — scrive pack (manifest + asset ± plugin) e pubblica o installa
   su edge/org. Dettaglio contratto e sandbox: `VIEW_MODES.md` § Sicurezza.

Fase 1 marketplace: 3–5 pack fake (es. Minimal, Industrial, Garden) applicano
soprattutto appearance; Garden può documentare “top_down coming” come teaser.

## White-label

Logo, palette locked (`capabilities.whiteLabel`), pack preinstallato su edge.
Appearance read-only dove `brandLocked: true`.

## Cosa NON fa

- Automazioni, Telegram, Node-RED  
- Nascondere punti non esposti (sicurezza = host)  
- Eseguire codice arbitrario non firmato da marketplace/SDK  

# View modes, Scene e Visual Pack

[Architettura](../DASHBOARD_ARCHITECTURE.md) ·
[Theming](THEMING.md) ·
[Host API](../HOST_API.md)

## Perché esistono

Il valore del prodotto finale è **presentare bene** ciò che sotto funziona già.
La dashboard non è un secondo Node-RED: è un **motore grafico pluggable** che
collega `ExposurePoint` a viste scaricabili o scritte da sviluppatori.

```text
Chi programma / marketplace
  └── Visual Pack (tema + scene + renderer + asset + animazioni)
            │
            ▼
Runtime Flutter
  └── ViewMode attivo → Renderer → binding verso ExposurePoint live
```

## Concetti

### ViewMode (tipo di vista)

Come guardo il sistema. Builtin previsti (estendibili):

| `kind` | Descrizione | Complessità |
|---|---|---|
| `cards` | Iconcine, gauge, griglia (default fase 1) | Bassa |
| `schematic` | Schema macchina / turbina / P&ID stilizzato | Media |
| `top_down` | Pianta dall’alto (serra, vasi, posizioni) | Media |
| `first_person` | Vista immersiva stilizzata “dentro” la scena | Alta |
| `custom` | Renderer fornito da un Visual Pack | Variabile |

### Scene

Spazio astratto indipendente dalla vista:

```text
Scene
  sceneId, name
  nodes[]
    nodeId, assetRef, label?
    transform { x, y, z?, rotation?, scale? }
    bindPointId?          ← ExposurePoint
    hotspots[]?           ← tap zones (first_person / top_down)
  edges[]?                ← per schematic (tubi, collegamenti)
  cameras[]?              ← per first_person
```

Stessa Scene può avere ViewMode `top_down` e `first_person` se il pack lo supporta.

### Renderer (plugin)

Interfaccia runtime (concettuale):

```text
ViewRenderer
  kind: ViewModeKind
  build(context, scene, appearance, pointValues) → Widget
  hitTest? / onCommand?
```

- **Builtin** — `CardsRenderer` in app core (fase 1).
- **Pack** — codice Dart dichiarato nel Visual Pack, caricato secondo policy sandbox
  (fase 2+: AOT plugins precompilati o asset-driven senza `dart:mirrors` dinamico
  arbitrario — vedi § Sicurezza).

### Visual Pack (unità marketplace / developer)

Sostituisce/estende il solo `ThemePack`:

```text
VisualPack
  packId, name, author, version, license
  previewImages[]
  appearance?: DashboardAppearance
  scenes[]?: Scene
  defaultViewMode: ViewModeKind
  supportedViewModes[]
  assets[]                 ← immagini, SVG, Rive, Lottie, mesh ref
  renderer:
    type: builtin | asset_driven | dart_plugin
    entry?: "package:my_greenhouse_view/greenhouse_renderer.dart"
  requiredCapabilities[]   ← animations, immersive3d, schematic, …
  minHostApiVersion
```

**Due canali di creazione (lasciare liberi entrambi):**

| Canale | Chi | Come |
|---|---|---|
| **Marketplace** | Chiunque | Scarica/applica pack curati o community |
| **Developer** | Chi sa programmare | Scrive Visual Pack (manifest + asset ± plugin Dart) e pubblica o installa locale |

L’utente finale non-programmatore: sceglie vista, applica pack, posiziona widget
sulla scena (editor limitato). Chi programma: crea viste e animazioni nuove.

## Binding sicuro verso i dati

Il pack **non** parla MQTT/Node-RED. Dichiarano solo:

```text
bind: node.vaso_3 → pointId "serra.vaso_3.umidita"
visualStateMap: { dry → "asset/wilt", ok → "asset/happy" }
```

Il runtime risolve i valori live dall’host. Se un `pointId` non è esposto, il nodo
mostra empty/offline — non inventa dati.

## Sicurezza e carico pack (importante)

Flutter **non** esegue Dart arbitrario scaricato a runtime in modo sicuro su tutte
le piattaforme. Policy prodotto:

1. **Fase 1–2:** pack **asset-driven** (JSON Scene + Rive/Lottie/SVG) + renderer
   **builtin** selezionato da `kind`. Sicuro, installabile da marketplace.
2. **Fase 2+:** plugin Dart come **package firmati** installati con l’app o via
   update channel (store / sideload edge), non eval remoto.
3. **Mai:** codice Node-RED o script host eseguiti dalla UI.

Così “creabile da chi sa programmare” resta vero; “scaricabile” resta sicuro.

## Esempi prodotto

| Pack | ViewModes | Effetto |
|---|---|---|
| `cards-minimal` | cards | Quadratini e icone |
| `greenhouse-plan` | top_down | Serra dall’alto, vasi posizionabili |
| `greenhouse-walk` | first_person | Camminata stilizzata tra i vasi |
| `turbine-schematic` | schematic | Schema turbina con valori sui nodi |
| `brand-acme-kiosk` | cards + schematic | Tema aziendale + logo |

## Relazione con appearance

Appearance = pelle globale (colori, brand).  
Visual Pack = **come** e **dove** disegni i punti.  
Si combinano: pack Greenhouse + brand ACME.

## Fase 1 vs dopo

| In fase 1 | Dopo (D200+) |
|---|---|
| Solo ViewMode `cards` | Registry ViewMode + Scene model |
| Theme pack shell | Visual Pack completo in marketplace |
| Widget `animated` builtin | Pack top_down / schematic / first_person stilizzato |
| Hook `capabilities.customViews` | Editor placement + SDK developer pack |

Il modello qui è **congelato a livello di prodotto** anche se il codice fase 1
implementa solo `cards`: non si chiude la porta alle viste libere.

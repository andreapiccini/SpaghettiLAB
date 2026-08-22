# Host API V1

**Stato:** congelata 2026-08-16 (D070)  
**Versione:** `Host API V1` (estensioni additive V1.1–V1.10)  
**Changelog:** [HOST_API_CHANGELOG.md](HOST_API_CHANGELOG.md)

La Flutter app consuma **solo** questo contratto (via `HostPort`). Automazioni
vivono in Node-RED / Config. Viste e grafica arrivano come **Visual Pack** +
appearance + layout/scene.

Runtime fase 1: ViewMode `cards`.  
Estensione **additiva D200** (V1.1): Scene + viste `schematic` / `top_down`.  
Estensione **additiva D230/D240** (V1.2): vista `first_person` + `installLocalPack`.  
Estensione **additiva** (V1.3): stili card scaricabili (`styleId` sul widget, catalogo marketplace).  
Estensione **additiva** (V1.4): storico punti (`getPointHistory`).  
Estensione **additiva** (V1.5): store pack firmati (`installStorePack`).  
Estensione **additiva** (V1.6): identità (`login` / `logout` / `currentSession` / `selectSite`).  
Estensione **additiva** (V1.7): ricetta stile card (`putCardStyle` + `recipe`).  
Estensione **additiva** (V1.8): utenti site (`listSiteUsers` / `inviteSiteUser` / `revokeSiteUser` / `listSiteSessions`).  
Estensione **additiva** (V1.9): Support Grant (`listSupportGrants` / `requestSupportGrant` / `approveSupportGrant` / `revokeSupportGrant`).  
Estensione **additiva** (V1.10): Partner console (`listPartnerSites` / `requestPartnerSiteAccess` / `applyPartnerBrand` / `queueSitePackageUpdate`).  
Runtime prodotto: `cards` e `schematic`. `top_down` / `first_person` restano sul wire e vengono mappati a `cards`.  
`custom` resta riservato.

JSON: **camelCase**. Errori: `offline` | `unauthorized` | `internal`.

---

## Concetti

| Concetto | Ruolo |
|---|---|
| **System** | Host/sistema selezionato (`name`, `address` opaco, `connectionState`) |
| **ExposurePoint** | Segnale umano già esposto; mai catalogo firmware/MQTT |
| **Layout** | Griglia cards (pagine + widget) |
| **Appearance** | Tema / brand / motion / displayMode |
| **ViewPreset** | Vista attiva: prodotto `cards` \| `schematic` (`top_down` / `first_person` → `cards`) |
| **VisualPack** | Unità marketplace (tema ± scena) |
| **CardStyle** | Stile scaricabile per una card (effetto + hint) |
| **Scene** | Nodi + binding `pointId` + edges (schematic) |
| **HistorySample** | Campione temporale per lo storico di un punto |

---

## Mapping `HostPort` ↔ REST

Solo questi metodi esistono nel client Flutter. Nessun altro endpoint è usato.

| `HostPort` | REST / WS |
|---|---|
| `login` | `POST /v1/auth/login` |
| `logout` | `POST /v1/auth/logout` |
| `currentSession` | `GET /v1/me` |
| `selectSite` | `POST /v1/auth/select-site` |
| `listSiteUsers` | `GET /v1/sites/{siteId}/users` |
| `inviteSiteUser` | `POST /v1/sites/{siteId}/invites` |
| `revokeSiteUser` | `POST /v1/sites/{siteId}/users/{userId}/revoke` |
| `listSiteSessions` | `GET /v1/sites/{siteId}/sessions` |
| `listSupportGrants` | `GET /v1/sites/{siteId}/support-grants` |
| `requestSupportGrant` | `POST /v1/sites/{siteId}/support-grants` |
| `approveSupportGrant` | `POST /v1/sites/{siteId}/support-grants/{grantId}/approve` |
| `revokeSupportGrant` | `POST /v1/sites/{siteId}/support-grants/{grantId}/revoke` |
| `listSystems` | `GET /v1/systems` |
| `getSystem` | `GET /v1/systems/{id}` |
| `createSystem` | `POST /v1/systems` |
| `getPoints` | `GET /v1/systems/{id}/points` |
| `getPointHistory` | `GET /v1/systems/{id}/history/{pointId}` |
| `getLayout` / `putLayout` | `GET` / `PUT /v1/systems/{id}/layout` |
| `getAppearance` / `putAppearance` | `GET` / `PUT /v1/systems/{id}/appearance` |
| `applyPack` | `POST /v1/systems/{id}/appearance/apply-pack` |
| `getView` / `putView` | `GET` / `PUT /v1/systems/{id}/view` |
| `listScenes` | `GET /v1/systems/{id}/scenes` |
| `getScene` / `putScene` | `GET` / `PUT /v1/systems/{id}/scenes/{sceneId}` |
| `listVisualPacks` | `GET /v1/marketplace/visual-packs` |
| `installLocalPack` | `POST /v1/marketplace/visual-packs/install-local` |
| `installStorePack` | `POST /v1/marketplace/visual-packs/{packId}/install` |
| `listCardStyles` | `GET /v1/marketplace/card-styles` |
| `installCardStyle` | `POST /v1/marketplace/card-styles/{styleId}/install` |
| `putCardStyle` | `POST /v1/marketplace/card-styles` |
| `getCapabilities` | `GET /v1/systems/{id}/capabilities` |
| `sendCommand` | `POST /v1/systems/{id}/commands/{pointId}` |
| `watch` | `WS /v1/systems/{id}/stream` |

### Riservati

`DELETE /v1/systems/{id}`, `GET …/points/{pointId}`,
`GET …/visual-packs/{packId}`, eventi stream `alarm` e `view_updated`,
viste `custom`. CRUD `CustomerOrg` / `Site`. Tunnel Support Grant di produzione.

Estensione futura = campi/endpoint **additivi**. Breaking change = V2.

---

## REST — corpi JSON

### `POST /v1/systems`

```json
{ "name": "Serra nord", "address": "https://host.local" }
```

`address` è opaco (nessun MQTT/PLC in UI). Risposta: oggetto System.

### System

```json
{
  "systemId": "casa-demo",
  "name": "Casa demo",
  "connectionState": "connected",
  "hostAddress": "fake://local",
  "lastSeen": "2026-08-16T14:00:00Z"
}
```

`connectionState`: `disconnected` | `connecting` | `connected` | `error`.

### ExposurePoint (`GET …/points`)

```json
{
  "pointId": "giardino.pompa",
  "label": "Pompa giardino",
  "kind": "actuator",
  "valueType": "boolean",
  "unit": null,
  "visualHint": "animated",
  "visualStates": ["idle", "running"],
  "writable": true,
  "commandPointId": null,
  "value": false,
  "visualState": "idle",
  "updatedAt": "2026-08-16T14:00:00Z"
}
```

`visualHint` wire: `gauge` | `value` | `switch` | `button` | `status` | `animated` | `sparkline`.  
Nel dominio Dart `switch` → enum `toggle`.

### Layout

```json
{
  "pages": [
    {
      "pageId": "home",
      "title": "Casa",
      "widgets": [
        {
          "widgetId": "w-0",
          "pointId": "salotto.temperatura",
          "visualHint": "gauge",
          "styleId": "style.gauge-arc",
          "column": 0,
          "row": 0,
          "width": 1,
          "height": 1
        }
      ]
    }
  ]
}
```

`styleId` è additivo (V1.3). Se assente, la card usa `visualHint` builtin.

### History — `GET …/history/{pointId}`

```json
{
  "pointId": "salotto.temperatura",
  "samples": [
    { "at": "2026-08-17T12:00:00Z", "value": 21.1 },
    { "at": "2026-08-17T12:03:00Z", "value": 21.4 }
  ]
}
```

Additivo V1.4. Punti non numerici → `samples: []`.

### CardStyle — `GET /v1/marketplace/card-styles`

```json
{
  "styleId": "style.light-bulb",
  "name": "Lampadina",
  "blurb": "Lampadina e azioni accesa / spenta.",
  "hint": "toggle",
  "effect": "lightBulb",
  "installed": true,
  "source": "marketplace"
}
```

`POST /v1/marketplace/card-styles/{styleId}/install` marca `installed: true`.  
`POST /v1/marketplace/card-styles` crea o aggiorna uno stile (`putCardStyle`), con `recipe` opzionale (layout, `labelX` / `valueX` / `unitX` / `bodyX`, formati, raggio, testi di stato, soglie).  
Gli stili installati compaiono nel widget picker; ogni widget sul canvas punta a uno `styleId`.

### Appearance — `GET` / `PUT /v1/systems/{id}/appearance`

```json
{
  "colors": { "accent": "#22C55E", "ok": "#4ADE80" },
  "background": {
    "kind": "gradient",
    "colors": ["#052e16", "#0F1114"],
    "imageRef": null
  },
  "animationProfile": "standard",
  "brand": { "name": "Garden", "logoRef": null },
  "menuStyle": "bottomBar",
  "displayMode": "normal",
  "typeDisplayScale": 1,
  "radiusScale": 1
}
```

| Campo | Valori |
|---|---|
| `background.kind` | `solid` \| `gradient` \| `image` |
| `animationProfile` | `subtle` \| `standard` \| `rich` |
| `menuStyle` | `bottomBar` \| `rail` |
| `displayMode` | `normal` \| `kiosk` \| `compact` |
| `colors` | override token (`accent`, `ok`, `bg.app`, …); mappa vuota = default |

### Apply pack — `POST …/appearance/apply-pack`

```json
{ "packId": "garden" }
```

Effetto: aggiorna appearance e può cambiare `view` + `sceneRef`
(Industrial → `schematic` / machine; gli altri pack restano su `cards`).
Pack installati in locale usano `defaultViewMode` (`top_down` / `first_person` → `cards`).
Stream: `appearance_updated` (il client ricarica anche la vista).

### View — `GET` / `PUT …/view`

```json
{
  "viewId": "default-cards",
  "kind": "cards",
  "sceneRef": null,
  "layoutRef": "home",
  "packRef": null
}
```

`kind` wire: `cards` | `schematic` | `top_down` | `first_person` | `custom`.  
PUT `custom` → errore (`internal` / non supportato).  
PUT `top_down` / `first_person` → salvati come `cards` (viste ritirate dal prodotto).

### Scene — `GET` / `PUT …/scenes/{sceneId}`

Coordinate nodi: percento 0–100.

```json
{
  "sceneId": "greenhouse",
  "name": "Serra",
  "kindHint": "top_down",
  "cameras": [{ "cameraId": "path", "x": 50, "z": 4, "yaw": 0 }],
  "nodes": [
    {
      "nodeId": "pompa",
      "pointId": "giardino.pompa",
      "label": "Pompa",
      "assetRef": "pump",
      "kind": "asset",
      "transform": { "x": 50, "y": 78, "z": 0, "rotation": 0, "scale": 1 }
    }
  ],
  "edges": [{ "from": "in", "to": "pump", "shape": "horizontal" }]
}
```

### Visual pack summary

```json
{
  "packId": "garden",
  "name": "Garden",
  "version": "0.2.0",
  "author": "SpaghettiLAB",
  "source": "marketplace",
  "teaserViewMode": "cards",
  "blurb": "Tema serra verde sulle cards.",
  "installed": true,
  "signed": false
}
```

`installed` / `signed` / `keyId` sono additivi V1.5. Pack store: `installed: false` finché non passa `installStorePack` (verifica Ed25519).

### Install pack locale — `POST /v1/marketplace/visual-packs/install-local`

Corpo: Visual Pack completo (stesso schema di `sdk/examples/local-walk.json`).
Campi summary possono stare in radice. Non esegue Dart: solo JSON + renderer builtin.

```json
{
  "packId": "sdk-example",
  "name": "Esempio SDK",
  "version": "0.1.0",
  "source": "local",
  "teaserViewMode": "cards",
  "defaultViewMode": "cards",
  "supportedViewModes": ["cards"],
  "appearance": { "colors": { "accent": "#A78BFA" } },
  "scenes": []
}
```

Canale developer: **nessuna firma obbligatoria**. Non esegue Dart.

### Install pack store — `POST /v1/marketplace/visual-packs/{packId}/install`

V1.5. L’host verifica la firma Ed25519 del catalogo store (`keyId` noto) e solo allora marca `installed: true`. Niente plugin Dart, niente pagamento.

### Capabilities

```json
{
  "customThemes": true,
  "marketplace": true,
  "whiteLabel": false,
  "animations": true,
  "kioskLock": false,
  "customViews": false,
  "appearanceLocked": false,
  "rbac": true
}
```

### Comando — `POST …/commands/{pointId}`

```json
{ "value": true }
```

`value`: number | boolean | string. Nessun campo regola.

---

## Streaming — `WS /v1/systems/{id}/stream`

Eventi V1 usati dal client: `point_updated`, `system_status`, `appearance_updated`.

### `point_updated`

```json
{
  "type": "point_updated",
  "pointId": "giardino.pompa",
  "value": true,
  "visualState": "running",
  "timestamp": "2026-08-16T14:00:00Z"
}
```

La UI **non** calcola `running`: mostra `visualState` ricevuto.

### `system_status`

```json
{ "type": "system_status", "systemId": "casa-demo", "online": true }
```

### `appearance_updated`

```json
{ "type": "appearance_updated" }
```

Riservati: `alarm`, `view_updated`.

---

## Cosa NON c'è (vincolo V1)

Nessun endpoint, campo o evento per:

- regole / automazioni / Telegram / Node-RED Admin
- MQTT, CBOR, Protocol V1 IDs, catalogo firmware
- eval di Dart remoto, pagamento marketplace

Le automazioni restano responsabilità **host / Node-RED / Config**. Aggiornano
`ExposurePoint` sotto la UI; la dashboard non le definisce.

Identità: [HOST_IDENTITY_API.md](HOST_IDENTITY_API.md). Support Grant: V1.9.

---

## Implementazioni

| Impl | Ruolo V1 |
|---|---|
| `FakeHost` | Casa demo in-process |
| `ProtocolV1Adapter` | D110: record Protocol V1 decodificati → `ExposurePoint` |
| `EdgeHost` | D120: `HostPort` live su MQTT (loopback o `mqtt://` / `ws://`) |
| `MqttCoreTransport` | MQTT Protocol V1 (`v1/cores/{id}/modules/+/records` + `requests`) |
| `LoopbackMqttBroker` / `SimulatedCore` | Core in-process (default **Core live**) |
| `NetworkMqttBroker` | Mosquitto TCP 1883 o WebSocket 9001 (Flutter web) |
| `CloudHost` | D130: HOST_API JSON via HTTP (`https://…/v1`) o `cloud://loopback` |
| `CompositeHost` | Casa demo + Core live + Core MQTT/cloud aggiunti |

# Dashboard Host API — contratto (bozza congelabile D070)

La Flutter app consuma **solo** questo contratto. Automazioni vivono in Node-RED /
Config. Viste e grafica arrivano come **Visual Pack** + appearance + layout/scene.

Stato: **bozza fase 1** — points, layout, appearance, marketplace shell; campi
ViewMode/Scene **dichiarati** per estensione additiva (runtime cards only).

## Concetti

- **System**, **ExposurePoint**, **Layout** (ViewMode `cards`)
- **Appearance** — tema / brand
- **ViewPreset** — vista attiva (`kind`: cards | …); fase 1 sempre `cards`
- **VisualPack** — unità marketplace/developer (tema ± scene ± renderer)
- **Scene** — opzionale; usato da view non-cards (fase 2+)

## REST

### Sistema / Exposure / Layout / Comandi

Invariati rispetto alla bozza precedente:

- `GET/POST/DELETE /v1/systems`, `GET /v1/systems/{id}`
- `GET /v1/systems/{id}/points[/{pointId}]`
- `GET/PUT /v1/systems/{id}/layout`
- `POST /v1/systems/{id}/commands/{pointId}`

### Appearance

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/v1/systems/{id}/appearance` | Tema corrente |
| `PUT` | `/v1/systems/{id}/appearance` | Salva appearance |
| `POST` | `/v1/systems/{id}/appearance/apply-pack` | Applica Visual Pack `{ packId }` |

### View (hook fase 1, runtime cards)

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/v1/systems/{id}/view` | `{ viewId, kind, sceneRef?, packRef? }` |
| `PUT` | `/v1/systems/{id}/view` | Imposta vista attiva (fase 1: solo `kind=cards`) |
| `GET` | `/v1/systems/{id}/scenes` | Lista scene (vuota o stub fase 1) |
| `GET` | `/v1/systems/{id}/scenes/{sceneId}` | Dettaglio Scene (fase 2+) |

### Marketplace

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/v1/marketplace/visual-packs` | Catalogo (alias legacy: `theme-packs`) |
| `GET` | `/v1/marketplace/visual-packs/{packId}` | Dettaglio pack |

### Capabilities

`GET /v1/systems/{id}/capabilities` — esempi:

`customThemes`, `marketplace`, `whiteLabel`, `animations`, `kioskLock`,
`customViews`, `appearanceLocked`, `rbac` (fase E021+)

Identità, ruoli, Support Grant: API separata — vedi `DEPLOYMENT_ACCESS_MODEL.md` e
task E020 (non in HOST_API dati fase 1).

## Streaming

`WS /v1/systems/{id}/stream` — `point_updated`, `system_status`, `alarm`,
`appearance_updated`, `view_updated` (fase 2+)

```json
{
  "type": "point_updated",
  "pointId": "giardino.pompa",
  "value": true,
  "visualState": "running",
  "timestamp": "2026-08-13T12:00:00Z"
}
```

## Cosa NON c'è

- Regole / Telegram / Node-RED Admin  
- Protocol V1 grezzo  
- Upload di Dart arbitrario non firmato  

Pack developer: canale install dedicato (fase 2), non eval remoto.

## Implementazioni

| Impl | Ruolo |
|---|---|
| `FakeHost` | Fixture + pack fake + view=`cards` |
| `EdgeHost` / `CloudHost` | Runtime reale + marketplace |
| `ProtocolV1Adapter` | Sotto host: record → ExposurePoint |

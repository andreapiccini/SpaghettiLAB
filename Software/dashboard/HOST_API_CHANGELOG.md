# Host API — changelog

## 2026-08-22 — V1.10 additive (Partner multi-site)

Console partner: portafoglio per `PartnerOrg`, isolamento tenant, brand e coda Site Package.

- `GET /v1/partner/sites` (`listPartnerSites`)
- `POST /v1/partner/sites/{siteId}/access-request` · `/brand` · `/package-update`
- Accesso site: `permanent` | `grant_required` | `grant_pending` | `grant_active`
- FakeHost: `partner@demo.local` (Verde) vs `partner-b@demo.local` (Blu)
- UI: Console partner al posto del semplice select-site
- Documento: [HOST_IDENTITY_API.md](HOST_IDENTITY_API.md)

## 2026-08-20 — V1.9 additive (Support Grant)

Accesso SpaghettiLAB solo con grant approvato, a tempo, auditato.

- `GET` / `POST /v1/sites/{siteId}/support-grants`
- `POST …/support-grants/{grantId}/approve` · `POST …/revoke`
- Senza `approved` non scaduto: `spaghetti_support` non entra nel site
- Canale demo `demo://loopback` (nessuna porta permanente)
- UI: Impostazioni → Supporto; schermata di attesa se il grant manca
- Documento: [HOST_IDENTITY_API.md](HOST_IDENTITY_API.md)

## 2026-08-19 — V1.8 additive (utenti site)

`site_admin` invita visitatori/operatori, revoca accesso, vede sessioni.

- `GET /v1/sites/{siteId}/users` · `POST /v1/sites/{siteId}/invites`
- `POST /v1/sites/{siteId}/users/{userId}/revoke` · `GET /v1/sites/{siteId}/sessions`
- Invito `integrator` → `unauthorized`. Audit host su invite/revoke
- UI: Impostazioni → tab Utenti (scope `host.user.manage`)
- Documento: [HOST_IDENTITY_API.md](HOST_IDENTITY_API.md)

## 2026-08-17 — V1.7 additive (editor stili card)

Ricetta JSON per layout/formati/raggio/soglie. Niente eval Dart.

- `POST /v1/marketplace/card-styles` (`HostPort.putCardStyle`) crea o aggiorna
- `CardStyle.recipe` additivo (label, `labelX` / `valueX` / `unitX` / `bodyX`, value, radius, testi stato, soglie)
- UI: Nuovo stile / Modifica in marketplace; icona stile in modifica canvas
- Scene `edges[].shape` additivo: `horizontal` \| `vertical` \| `rounded` (omesso = auto)

## 2026-08-17 — V1.6 additive (login / RBAC)

Identità su `HostPort`. Enforcement sul host; la UI nasconde tab e comandi.

- `POST /v1/auth/login` · `POST /v1/auth/logout` · `GET /v1/me` · `POST /v1/auth/select-site`
- Scope da sessione (`dashboard.view` / `.command` / `.appearance.edit` / `.layout.edit` / `.marketplace`)
- FakeHost: account demo viewer / operator / admin / partner; `requireLogin` in produzione
- Documento: [HOST_IDENTITY_API.md](HOST_IDENTITY_API.md)

## 2026-08-17 — V1.5 additive (store firmato)

Pack marketplace firmati Ed25519. Niente eval Dart, niente pagamento.

- `POST /v1/marketplace/visual-packs/{packId}/install` (`HostPort.installStorePack`)
- Summary pack: `installed`, `signed`, `keyId` (additivi)
- Catalogo demo: pack **Notte** (scarica/verifica, poi Applica)
- `install-local` resta il canale SDK senza firma

## 2026-08-17 — V1.4 additive (storico + viste prodotto)

Storico punti e ritiro Pianta/Dentro dal prodotto (non breaking).

- `GET /v1/systems/{id}/history/{pointId}` (`HostPort.getPointHistory`)
- PUT `top_down` / `first_person` → `cards`
- Runtime prodotto: switcher **Cards** / **Schema**
- Layout: ordine widget persistito (drag in modifica)
- Host: `ProtocolV1Adapter` + `EdgeHost` MQTT (`packages/dashboard_host`); Flutter resta su `HostPort`
- `POST /v1/systems` `address` opaco: se è `mqtt://` / `ws://` / `wss://` l’host apre un Core MQTT (TCP 1883 o WebSocket 9001 sul web); `https://` / `cloud://loopback` apre un `CloudHost` HOST_API

## 2026-08-16 — V1.3 additive (stili card)

Catalogo stili scaricabili per le cards (non breaking).

- `GET /v1/marketplace/card-styles` (`HostPort.listCardStyles`)
- `POST /v1/marketplace/card-styles/{styleId}/install` (`HostPort.installCardStyle`)
- Layout widget: campo opzionale `styleId`
- Picker: sceglie uno stile installato (o lo scarica in-place)
- Marketplace: sezione **Stili card** con Scarica / In libreria
- `visualHint` resta il fallback se `styleId` manca

## 2026-08-16 — V1.2 additive (D230 / D240)

Vista `first_person` + install pack locale (non breaking).

- PUT view accetta `first_person` con `sceneRef` (scena `walk` in FakeHost)
- `Scene.cameras[]` (`cameraId`, `x`, `z`, `yaw`)
- `POST /v1/marketplace/visual-packs/install-local` (`HostPort.installLocalPack`)
- Corpo: JSON Visual Pack (summary + appearance + scenes)
- `custom` resta riservato; nessun eval Dart remoto

## 2026-08-16 — V1.1 additive (D200)

Scene + viste `schematic` / `top_down` (non breaking).

- `GET/PUT /v1/systems/{id}/scenes[/{sceneId}]`
- PUT view accetta `schematic` e `top_down` con `sceneRef`
- apply-pack Garden/Industrial cambia vista (non solo appearance)
- `first_person` / `custom` restano riservati

## 2026-08-16 — V1 frozen (D070)

Contratto presentation-only congelato.

- Versione: **Host API V1**.
- Mapping completo `HostPort` ↔ REST/WS.
- JSON documentati: System, ExposurePoint, Layout, Appearance, apply-pack,
  ViewPreset, VisualPack summary, Capabilities, comandi, stream
  `point_updated` (con `visualState`), `system_status`, `appearance_updated`.
- Nessun endpoint regole / MQTT / Protocol V1 / Telegram.
- Campi View/Scene riservati additivi; runtime fase 1 = `cards`.
- Breaking change successive = V2.

## Prima di D070

Bozza fase 1 (paths appearance, marketplace, view hook) senza JSON completi
né freeze.

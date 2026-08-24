# Visual Pack SDK (locale)

[Host API](../HOST_API.md) · [View modes](../design/VIEW_MODES.md)

Pack = JSON (appearance + scene) + renderer **builtin**. Nessun eval Dart remoto.

## Schema

`packId`, `name`, `version`, `source` (`local` | `developer` | …),
`defaultViewMode`, `supportedViewModes`, `appearance?`, `scenes[]`.

Nodi: `transform.x/y` in % 0–100.

## Install locale

1. Copia `examples/local-walk.json` e cambia `packId` / binding `pointId`.
2. `POST /v1/marketplace/visual-packs/install-local` (FakeHost: `installLocalPack`).
3. `POST …/appearance/apply-pack` con quel `packId`.

In dashboard: Pack → **Installa esempio SDK**.

Store (D250): pack firmati Ed25519, `POST …/visual-packs/{packId}/install`.
Niente plugin Dart scaricati, niente pagamento. Chiave demo:
seed SHA-256 di `SpaghettiLAB-dashboard-store-dev-v1` (`keyId` `spaghetti-lab-dev`).

# Marketplace — Host behavior

[Visual](visual.md) · [UI](ui-behavior.md)

| Azione | API |
|---|---|
| Catalogo | `GET /v1/marketplace/visual-packs` |
| Installa store | `POST /v1/marketplace/visual-packs/{packId}/install` (firma Ed25519) |
| Installa locale | `POST /v1/marketplace/visual-packs/install-local` |
| Applica | `POST /v1/systems/{id}/appearance/apply-pack` `{ packId }` |
| Live | stream `appearance_updated` |

Allineato a `design/VIEW_MODES.md`: pack può dichiarare `teaserViewMode`; fase 1 il runtime resta `cards`.

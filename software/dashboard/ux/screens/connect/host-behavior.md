# Connect — Host behavior

[Visual](visual.md) · [UI](ui-behavior.md)

| Azione | API |
|---|---|
| Lista | `GET /v1/systems` |
| Dettaglio | `GET /v1/systems/{id}` |
| Aggiungi | `POST /v1/systems` `{ name, address }` |
| Errori | `offline`, `unauthorized` → `ErrorPanel` |

Stato connessione da `connectionState` e stream `system_status`.

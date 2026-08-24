# Canvas — Host behavior

[Visual](visual.md) · [UI](ui-behavior.md)

Solo `HOST_API.md`.

| Azione | API |
|---|---|
| Carica griglia | `GET /v1/systems/{id}/layout` |
| Carica punti | `GET /v1/systems/{id}/points` |
| Vista attiva | `GET /v1/systems/{id}/view` → fase 1 `kind=cards` |
| Live valori | `WS …/stream` eventi `point_updated` (`value`, `visualState`) |
| Tema / sfondo | `GET appearance`; stream `appearance_updated` |
| Comando switch/button | `POST /v1/systems/{id}/commands/{pointId}` |
| Apply pack | non dal canvas; marketplace chiama `POST appearance/apply-pack` e il canvas si ridisegna dallo stream |

Niente regole, niente Telegram, niente Protocol V1. Se lo stream dice `visualState=running`, la pompa gira.

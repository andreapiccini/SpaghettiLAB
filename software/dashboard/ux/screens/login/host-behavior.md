# Login — Host behavior

[Visual](visual.md) · [UI](ui-behavior.md)

| Azione | API |
|---|---|
| Accedi | `POST /v1/auth/login` `{ email, password }` |
| Sessione | `GET /v1/me` |
| Esci | `POST /v1/auth/logout` |
| Errori | `unauthorized` → "Accesso non consentito"; `offline` → ErrorPanel |

Token opaco in sessione; header `Authorization` solo sul trasporto HTTP.

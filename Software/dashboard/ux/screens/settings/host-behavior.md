# Settings — Host behavior

[Visual](visual.md) · [UI](ui-behavior.md)

| Azione | API |
|---|---|
| Capability | `GET /v1/systems/{id}/capabilities` (`marketplace`, `kioskLock`, `appearanceLocked`) |
| Display | `PUT /v1/systems/{id}/appearance` campo `displayMode` |
| Host | `GET /v1/systems/{id}` read-only |
| Sessione | `GET /v1/me` |
| Esci | `POST /v1/auth/logout` |
| Elenco utenti | `GET /v1/sites/{siteId}/users` (`host.user.manage`) |
| Invito | `POST /v1/sites/{siteId}/invites` `{ email, role }` — `role`: `viewer` \| `operator` |
| Revoca | `POST /v1/sites/{siteId}/users/{userId}/revoke` |
| Sessioni | `GET /v1/sites/{siteId}/sessions` read-only |
| Grant | `GET` / `POST /v1/sites/{siteId}/support-grants` |
| Approva grant | `POST /v1/sites/{siteId}/support-grants/{grantId}/approve` |
| Revoca grant | `POST /v1/sites/{siteId}/support-grants/{grantId}/revoke` |

`integrator` in invite → `unauthorized`. Audit host su invite/revoke e su request/approve/revoke grant.
Accesso `spaghetti_support` impossibile senza grant `approved` non scaduto.

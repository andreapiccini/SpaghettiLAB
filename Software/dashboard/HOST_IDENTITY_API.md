# Host Identity API V1

**Stato:** FakeHost + HOST_API V1.9 (E020 stub + E051 utenti + E080 Support Grant)  
**Allinea:** [DEPLOYMENT_ACCESS_MODEL.md](../DEPLOYMENT_ACCESS_MODEL.md)  
**Presentation:** [HOST_API.md](HOST_API.md)

Identità e tenancy. La Flutter app parla solo `HostPort` (`login`, `logout`,
`currentSession`, `selectSite`, utenti site, Support Grant). JWT reale e CRUD org/site restano per
l’host di produzione. FakeHost emette un token opaco `dev.*`, non un JWT.

JSON **camelCase**. Errori: `offline` | `unauthorized` | `internal`.

---

## Session

```json
{
  "token": "dev.admin@demo.local.site-casa",
  "user": {
    "userId": "user-admin",
    "email": "admin@demo.local",
    "displayName": "Admin demo"
  },
  "sites": [
    {
      "siteId": "site-casa",
      "name": "Casa demo",
      "orgId": "org-demo",
      "roles": ["site_admin"],
      "scopes": ["dashboard.view", "dashboard.command"]
    }
  ],
  "selectedSiteId": "site-casa",
  "expiresAt": "2026-08-18T04:00:00Z"
}
```

Claim previsti per un JWT di produzione: `sub`, `orgId`, `siteId`, `roles[]`,
`scopes[]`, `exp`. Nessun segreto nel payload.

---

## Endpoints

| `HostPort` | REST |
|---|---|
| `login` | `POST /v1/auth/login` `{ email, password }` → session |
| `logout` | `POST /v1/auth/logout` |
| `currentSession` | `GET /v1/me` |
| `selectSite` | `POST /v1/auth/select-site` `{ siteId }` → session |
| `listSiteUsers` | `GET /v1/sites/{siteId}/users` |
| `inviteSiteUser` | `POST /v1/sites/{siteId}/invites` `{ email, role }` → invite |
| `revokeSiteUser` | `POST /v1/sites/{siteId}/users/{userId}/revoke` |
| `listSiteSessions` | `GET /v1/sites/{siteId}/sessions` |
| `listSupportGrants` | `GET /v1/sites/{siteId}/support-grants` |
| `requestSupportGrant` | `POST /v1/sites/{siteId}/support-grants` |
| `approveSupportGrant` | `POST /v1/sites/{siteId}/support-grants/{grantId}/approve` |
| `revokeSupportGrant` | `POST /v1/sites/{siteId}/support-grants/{grantId}/revoke` |

`GET /v1/me` senza sessione valida → `unauthorized`.

Utenti site richiedono `host.user.manage`. Invito: `role` solo `viewer` | `operator`
(`integrator` → `unauthorized`). Revoca non può colpire l’attore. Sessioni read-only.

```json
{
  "userId": "user-viewer",
  "email": "viewer@demo.local",
  "displayName": "Viewer demo",
  "role": "viewer",
  "status": "active"
}
```

`status`: `active` | `invited` | `revoked`.

### Support Grant

`spaghetti_support` entra in un site solo con grant `approved` non scaduto
(`approvedBy` obbligatorio). Scope sessione: `dashboard.view` + `host.support.session`.
Durata demo: 8 ore. Audit: `support_request` / `support_approve` / `support_revoke`.

```json
{
  "grantId": "grant-1",
  "siteId": "site-casa",
  "requesterEmail": "admin@demo.local",
  "approvedByEmail": "admin@demo.local",
  "status": "approved",
  "scope": "read_only",
  "channel": "demo://loopback",
  "createdAt": "2026-08-20T13:00:00Z",
  "expiresAt": "2026-08-20T21:00:00Z"
}
```

`status`: `pending` | `approved` | `revoked` | `expired`.  
`scope`: `read_only` (demo). `channel` è opaco: **nessuna porta permanente**.

Opzioni tunnel di produzione (scelta infra, non in FakeHost):

| Canale | Nota |
|---|---|
| Reverse SSH / WireGuard outbound | Il site apre verso SpaghettiLAB; no inbound 24/7 |
| Tailscale ACL | Solo nodi nel grant, scadenza via ACL |
| HTTPS mTLS | Certificato a tempo sul grant, revoca = CRL/short TTL |

Partner su site **già** in portafoglio usa il ruolo permanente. Partner su site
extra: stesso flusso grant.

HTTP: header `Authorization: Bearer <token>` sulle chiamate successive (CloudHost).

### Riservati

CRUD `CustomerOrg` / `Site`. Tunnel di produzione.

---

## Scope

| Scope | Uso dashboard |
|---|---|
| `dashboard.view` | Canvas, punti, storico, vista Cards/Schema |
| `dashboard.command` | Comandi manuali sui punti esposti |
| `dashboard.appearance.edit` | Tema / Aspetto |
| `dashboard.layout.edit` | Modifica layout e scena |
| `dashboard.marketplace` | Pack e stili |
| `host.user.manage` | Utenti site (E051) |
| `host.system.manage` | Aggiungere sistemi host |
| `host.support.grant.approve` | Support Grant (E080) |
| `host.support.session` | Sessione grant |
| `nodered.view` / `.edit` / `.deploy` | Node-RED (E060) |
| `partner.site.manage` / `partner.brand.manage` | Multi-site partner |

Matrice ruolo → scope: `scopesForRole` in `dashboard_domain`. Enforcement sul host
(`FakeHost.requireScope`); la UI nasconde ma non autorizza.

---

## Account demo (FakeHost)

| Email | Password | Ruolo |
|---|---|---|
| `viewer@demo.local` | `viewer` | viewer |
| `operator@demo.local` | `operator` | operator |
| `admin@demo.local` | `admin` | site_admin |
| `partner@demo.local` | `partner` | partner_admin (Casa + Serra) |
| `support@demo.local` | `support` | spaghetti_support (solo con grant approvato) |

`FakeHost(requireLogin: true)` parte senza sessione. Senza il flag, sessione
`site_admin` (test e host interni).

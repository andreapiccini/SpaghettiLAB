# Host Identity API V1

**Stato:** FakeHost + HOST_API V1.6 (E020 stub)  
**Allinea:** [DEPLOYMENT_ACCESS_MODEL.md](../DEPLOYMENT_ACCESS_MODEL.md)  
**Presentation:** [HOST_API.md](HOST_API.md)

Identità e tenancy. La Flutter app parla solo `HostPort` (`login`, `logout`,
`currentSession`, `selectSite`). JWT reale e CRUD org/site/invite restano per
l’host di produzione (E051+). FakeHost emette un token opaco `dev.*`, non un JWT.

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

`GET /v1/me` senza sessione valida → `unauthorized`.

HTTP: header `Authorization: Bearer <token>` sulle chiamate successive (CloudHost).

### Riservati (E051 / E080)

`POST /v1/sites/{id}/invites`, CRUD `CustomerOrg` / `Site`, Support Grant.

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

`FakeHost(requireLogin: true)` parte senza sessione. Senza il flag, sessione
`site_admin` (test e host interni).

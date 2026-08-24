# E020 — Identity & tenancy API

**Stato:** ✅ DONE (2026-08-17) — spec + FakeHost stub
**Dipende da:** E010 (doc)
**Blocca:** E021, E050, E060, E080

## Obiettivo

Contratto Host per identità multi-tenant: org, site, utente, ruolo, sessione.

## Implementazione richiesta

1. Estendere documento API (o `software/dashboard/HOST_IDENTITY_API.md`):
   - `POST /v1/auth/login` → JWT/session
   - `GET /v1/me` → user, orgs, sites, roles[]
   - CRUD `CustomerOrg`, `Site` (partner_admin+)
   - Invito utente `POST /v1/sites/{id}/invites`
2. JWT claims: `sub`, `orgId`, `siteId`, `roles[]`, `scopes[]`, `exp`
3. Tenancy: partner vede solo site del proprio portafoglio
4. Nessun segreto in JWT payload oltre id opachi

## Verifiche

- viewer non può chiamare endpoint integrator
- documento allineato a `DEPLOYMENT_ACCESS_MODEL.md`

## Fine task

- [x] API spec scritta (`HOST_IDENTITY_API.md`).
- [x] FakeHost stub auth per dev dashboard.
- [ ] JWT issuer di produzione e CRUD org/site (host di produzione). Inviti site: E051.

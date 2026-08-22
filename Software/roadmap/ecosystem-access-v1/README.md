# Roadmap Ecosystem Access — deployment, ruoli, turnkey

[Modello deployment](../../DEPLOYMENT_ACCESS_MODEL.md) ·
[Indice master Software](../../SOFTWARE_MASTER_INDEX.md) ·
[Dashboard](../../dashboard/DASHBOARD_ARCHITECTURE.md) ·
[Node-RED](../node-red/README.md)

Roadmap **cross-cutting**: identità, tenancy, Site Package turnkey, accesso remoto
sicuro. Non sostituisce dashboard-v1 fase UI; parte **dopo** o in parallelo al gate
D080 quando host reale esiste (E020+).

## Obiettivo

Permettere di vendere:

1. **Site Package** già configurato (dashboard + Node-RED + exposure) on-prem cliente.
2. **Ruoli** distinti: utente base, IT, tecnico, partner brand, SpaghettiLAB support.
3. **Accesso remoto** solo con grant approvato, auditato, a tempo.

## Fasi

| Stato | Task | Superficie | Risultato |
|---|---|---|---|
| | **E010 — Modello formale** | Doc | |
| ✅ | [E010 — Deployment & access model](../../DEPLOYMENT_ACCESS_MODEL.md) | Software | Modello congelato. |
| | **E020 — Contratti host identity** | Host API | |
| ✅ | [E020 — Identity & tenancy API](tasks/E020-identity-tenancy-api.md) | Host | Spec + FakeHost stub (JWT produzione = dopo). |
| ✅ | [E021 — Scope matrix & enforcement](tasks/E021-scope-matrix-enforcement.md) | Host | `scopesForRole` + `FakeHost.requireScope`. |
| | **E030 — Site Package turnkey** | Deploy | |
| ⬜ | [E070 — Site Package manifest](tasks/E070-site-package-manifest.md) | Host + compose | Formato manifest + compose profile. |
| ⬜ | [E071 — Activation wizard](tasks/E071-site-activation-wizard.md) | Host + dashboard | Primo avvio, site_admin, apply package. |
| | **E040 — Dashboard auth UI** | Flutter | |
| ✅ | [E050 — Login & role-aware shell](tasks/E050-dashboard-login-rbac-shell.md) | Dashboard | Login, nav e comandi per scope. |
| ✅ | [E051 — Settings admin (site users)](tasks/E051-dashboard-site-admin-users.md) | Dashboard | site_admin: inviti utenti base. |
| | **E050 — Node-RED access** | Node-RED | |
| ⬜ | [E060 — Node-RED auth proxy](tasks/E060-nodered-auth-scoped-access.md) | Node-RED + host | Admin dietro host; deploy scoped. |
| | **E060 — Support remoto** | Host | |
| ✅ | [E080 — Support Grant flow](tasks/E080-support-grant-flow.md) | Host | Richiesta → approvazione → sessione audit. |
| ⬜ | [E081 — Partner multi-site console](tasks/E081-partner-multi-site-console.md) | Host + dashboard | partner_admin: elenco site clienti. |
| | **E090 — Chiusura** | | |
| ⬜ | [E090 — Threat model & audit gate](tasks/E090-access-threat-audit-gate.md) | Tutti | Nessun segreto in log; grant testati. |

## Dipendenze

```text
E010 (doc)
  │
E020 → E021
  │
E070 → E071 ─────────────┐
  │                      │
E021 → E050, E051        │
E021 → E060              │
E021 → E080 → E090       │
E070 ────────────────────┘
E081 dipende da E020 + E050
```

**Prerequisiti esterni:** Dashboard Host runtime (dashboard D120 edge), non solo FakeHost.

## Fuori scope iniziale

- SSO enterprise (SAML/OIDC) — estensione E020 dopo MVP email+JWT
- Billing / subscription — prodotto commerciale separato
- Accesso remoto senza approvazione site

## Gate E090

- Matrice ruoli implementata su host per almeno 4 ruoli (viewer, operator, site_admin, integrator)
- Support Grant: impossibile accedere senza `approvedBy`
- Site Package: deploy demo end-to-end on-prem via compose
- Audit append-only per grant session e deploy Node-RED

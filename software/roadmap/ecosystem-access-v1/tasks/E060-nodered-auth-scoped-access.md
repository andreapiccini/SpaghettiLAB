# E060 — Node-RED auth & scoped access

**Stato:** ⬜ TODO
**Dipende da:** E021
**Blocca:** E090

## Obiettivo

Node-RED Admin **dietro host** (reverse proxy + SSO token); deploy/edit scoped per ruolo.

## Implementazione richiesta

1. `software/node-red/compose.yaml`: servizio dietro host auth proxy (no admin aperto).
2. `adminAuth` o OIDC proxy verso host JWT.
3. Scope: `nodered.view` read-only editor; `nodered.deploy` per deploy.
4. Flow SpaghettiLAB owned vs user flows — già previsto S113; enforcement path.
5. Documentare in `node-red/README.md` + `DEPLOYMENT_ACCESS_MODEL.md`.

## Verifiche

- viewer/operator → 403 su editor
- integrator deploy auditato
- compose default non espone 1880 su 0.0.0.0 senza auth

## Fine task

- [ ] Node-RED non raggiungibile senza auth in profile turnkey.
- [ ] README aggiornato.

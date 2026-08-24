# E080 — Support Grant flow

**Stato:** ✅ DONE (2026-08-20)
**Dipende da:** E021, E051
**Blocca:** E090

## Obiettivo

Accesso remoto SpaghettiLAB (e partner con contratto) **solo** via grant approvato.

## Implementazione richiesta

1. API:
   - `POST /v1/sites/{id}/support-grants` (request)
   - `POST .../support-grants/{id}/approve` (site_admin)
   - `POST .../support-grants/{id}/revoke`
   - Session token scoped + `expiresAt`
2. Dashboard: site_admin vede richieste pending; spaghetti_support vede sessioni attive.
3. Tunnel/channel: documentare opzioni (reverse SSH, Tailscale ACL, mTLS) — scelta infra
   in task, principio: no porta permanente.
4. Audit append-only ogni azione in grant scope.

## Verifiche

- accesso impossibile senza approve
- scadenza automatica revoca session
- partner grant richiede stesso flusso se non ruolo permanente

## Fine task

- [x] Flow completo demo.
- [ ] Threat notes in E090.

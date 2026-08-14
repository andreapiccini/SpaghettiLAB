# E050 — Dashboard login & role-aware shell

**Stato:** ⬜ TODO
**Dipende da:** E021, dashboard D080 (fase 1 UI)
**Blocca:** E051, E081

## Obiettivo

Login dashboard + navigazione che rispetta ruolo (viewer vs operator vs admin).

## Implementazione richiesta

1. Schermate UX: `login`, `select-site` (se multi-site).
2. `AuthRepository` → host identity API.
3. Shell: nascondi appearance/marketplace/node-red link per viewer.
4. `capabilities` + `scopes` da session — non hardcode ruoli in widget.
5. Spec UX 3 file per `login` (aggiungere a dashboard ux/).

## Verifiche

- viewer: solo canvas view, no edit layout
- operator: comandi manuali ok
- offline session expiry gestito

## Fine task

- [ ] Login + shell role-aware.
- [ ] Spec UX login.

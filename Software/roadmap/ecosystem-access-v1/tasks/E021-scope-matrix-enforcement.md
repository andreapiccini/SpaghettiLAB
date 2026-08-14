# E021 — Scope matrix & enforcement

**Stato:** ⬜ TODO
**Dipende da:** E020
**Blocca:** E050, E060, E080, E090

## Obiettivo

Enforcement **unico sul host**; estensione scope oltre S121 React Flow.

## Implementazione richiesta

1. Definire scope completi (vedi DEPLOYMENT_ACCESS_MODEL § mapping).
2. Tabella ruolo → scope default (configurabile per site policy).
3. Middleware host: ogni endpoint HOST_API + identity API verifica scope.
4. Allineare `PERMISSION_SCOPES` in `micro-flow-editor/packages/domain` (estensione
   opzionale package condiviso o doc-only finché host non condivide lib).
5. Audit event su deny + grant actions.

## Verifiche

- test automatici: ogni ruolo × endpoint critico
- app Flutter/React Flow: UI disabilita ma host rifiuta comunque se bypass

## Fine task

- [ ] Matrice implementata su host reference.
- [ ] Test enforcement verdi.

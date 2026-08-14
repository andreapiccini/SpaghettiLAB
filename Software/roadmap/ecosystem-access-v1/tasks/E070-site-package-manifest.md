# E070 — Site Package manifest

**Stato:** ⬜ TODO
**Dipende da:** E010, dashboard D070 (Visual Pack), node-red flows future
**Blocca:** E071

## Obiettivo

Formato **Site Package**: prodotto turnkey consegnabile (manifest + bundle refs).

## Implementazione richiesta

1. Schema `SitePackage` versionato (JSON/YAML) come in DEPLOYMENT_ACCESS_MODEL.
2. `Software/deploy/site-package/` esempio minimo:
   - `manifest.yaml`
   - refs: visual pack, node-red bundle, exposure manifest
   - `compose.profile.yaml` — servizi: host, node-red, broker opzionale
3. Script `apply-site-package.sh` (idempotente, audit log).
4. README: flusso partner prepara → cliente installa.

## Verifiche

- apply su stack vuoto produce dashboard + node-red + exposure fake funzionanti
- manifest non contiene segreti (solo refs)

## Fine task

- [ ] Schema + esempio + script apply.
- [ ] Documentato in DEPLOYMENT_ACCESS_MODEL.

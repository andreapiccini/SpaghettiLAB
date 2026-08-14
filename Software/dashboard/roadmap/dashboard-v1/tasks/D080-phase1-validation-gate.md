# D080 — Gate fase 1

**Stato:** ⬜ TODO
**Dipende da:** D070

## Checklist

### Visione prodotto
- [ ] Focus grafica documentato (architecture + VIEW_MODES)
- [ ] Nessuna automazione in app/domain
- [ ] Widget animato da ExposurePoint (pompa)
- [ ] Appearance + marketplace shell
- [ ] ViewRendererRegistry esiste; solo `cards` registrato
- [ ] Canali marketplace + developer dichiarati (SDK = fase 2)

### Documentazione
- [ ] `DASHBOARD_ARCHITECTURE.md`, `THEMING.md`, `VIEW_MODES.md`
- [ ] Spec UX 9 schermate
- [ ] `HOST_API.md` V1 (view hook, no rules)

### Codice / build
- [ ] `make ci` (Docker) passa da checkout pulito — vedi `ENVIRONMENT.md`
- [ ] analyze + test; build web in CI container
- [ ] build nativo almeno un target (FVM locale) documentato, non gate Docker
- [ ] FakeHost: pompa, appearance, ≥3 visual pack fake

### Demo
- [ ] README: flusso presentazione-first 5 min

## Fine task

- [ ] Gate datato; roadmap D010–D080 ✅; D200 elencati come next grafica

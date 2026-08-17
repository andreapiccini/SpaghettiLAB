# D080 — Gate fase 1

**Stato:** ✅ DONE (2026-08-16)
**Dipende da:** D070

## Checklist

### Visione prodotto
- [x] Focus grafica documentato (architecture + VIEW_MODES)
- [x] Nessuna automazione in app/domain
- [x] Widget animato da ExposurePoint (pompa)
- [x] Appearance + marketplace shell
- [x] ViewRendererRegistry esiste; solo `cards` registrato
- [x] Canali marketplace + developer dichiarati (SDK = fase 2)

### Documentazione
- [x] `DASHBOARD_ARCHITECTURE.md`, `THEMING.md`, `VIEW_MODES.md`
- [x] Spec UX 9 schermate
- [x] `HOST_API.md` V1 (view hook, no rules) — freeze D070 2026-08-16

### Codice / build
- [x] `make ci` (Docker) passa da checkout pulito — vedi `ENVIRONMENT.md`
- [x] analyze + test; build web in CI container
- [x] build nativo almeno un target (FVM locale) documentato, non gate Docker — `ENVIRONMENT.md` § nativo
- [x] FakeHost: pompa, appearance, ≥3 visual pack fake

### Demo
- [x] README: flusso presentazione-first 5 min

## Fine task

- [x] Gate datato **2026-08-16**; roadmap D010–D080 ✅; D200 elencati come next grafica

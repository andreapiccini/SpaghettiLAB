# D011 — Scaffold Flutter, design system, ambiente Docker + CI

**Stato:** ✅ DONE
**Dipende da:** D010
**Blocca:** D050, D051

## Obiettivo

Workspace Flutter multi-piattaforma **riproducibile dopo clone**: stessa SDK pinata,
`analyze`/`test`/`build web` in Docker (gate obbligatorio), dev web in Compose.
Vedi `ENVIRONMENT.md`.

## Implementazione richiesta

1. `flutter create` in `software/dashboard/app/` (iOS, Android, Web, macOS, Windows,
   Linux — abilitare target team).
2. Package `software/dashboard/packages/dashboard_domain/` — Dart puro.
3. Theme da `design/DESIGN_TOKENS.md`.
4. **Pin SDK Flutter:**
   - `.fvm/fvm_config.json` + `.fvmrc` (versione esplicita, es. `3.24.5`)
   - stessa versione nel tag immagine Docker Cirrus (`ghcr.io/cirruslabs/flutter:x.y.z`)
5. **Docker riproducibile:**
   - `Dockerfile` — SDK pinata, `WORKDIR /workspace`, `flutter pub get` in `app/`
   - `compose.yaml`:
     - `dashboard-ci` — `flutter analyze`, `flutter test`, `flutter build web`
     - `dashboard-dev-web` — `flutter run -d web-server` su porta host (bind mount)
   - volume named `dashboard-pub-cache` per cache pub
6. `Makefile`: target `ci`, `dev-web`, `shell` (wrapper compose).
7. `analysis_options.yaml` strict.
8. Documentare in `README.md` + `ENVIRONMENT.md`:
   - path Docker-only (web + CI);
   - path FVM per nativo iOS/Android/desktop;
   - cosa **non** è supportato in container (iOS sim, macOS build).
9. Opzionale ma consigliato: `.devcontainer/devcontainer.json` che riusa Dockerfile.

## Verifiche

- da checkout pulito **senza Flutter host installato**: `make ci` passa via Docker;
- `dashboard_domain` non importa `package:flutter`;
- versione SDK in FVM = tag Docker (documentato in ENVIRONMENT.md);
- dev web raggiungibile su loopback dopo `docker compose up dashboard-dev-web`.

## Fine task

- [ ] Struttura app + domain + theme.
- [ ] Dockerfile + compose.yaml + Makefile + FVM pin.
- [ ] ENVIRONMENT.md allineato; README con comandi clone → run.

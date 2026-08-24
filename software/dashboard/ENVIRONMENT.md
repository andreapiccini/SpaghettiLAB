# Ambiente di sviluppo Dashboard (riproducibile)

[README](README.md) · [Roadmap D011](roadmap/dashboard-v1/tasks/D011-flutter-workspace-and-design-system.md)

## Problema

Dopo un clone, `flutter run` può fallire per versione SDK diversa, dipendenze mancanti
o toolchain non allineata. L’ambiente deve essere **ripetibile** come
`software/node-red/` e `software/micro-flow-editor/`.

## Strategia (due binari)

| Binario | Scopo | Obbligatorio per contribuire |
|---|---|---|
| **Docker + Compose** | `analyze`, `test`, `build web`, dev **web** con hot reload | Sì (gate CI) |
| **FVM** (Flutter Version Management) | Stessa versione SDK Flutter fuori Docker | Consigliato per mobile/desktop nativo |

Non esiste un’immagine Docker “ufficiale Google” per Flutter; lo standard de facto per
CI è **[Cirrus Labs `flutter` Docker images](https://github.com/cirruslabs/docker-images-flutter)**
(tag pinati, es. `3.32.8`). In parallelo **FVM** è lo strumento community più usato
per pinare la SDK nel repo (`.fvm/fvm_config.json` + `.fvmrc`).

## Cosa va in Docker (D011)

```text
software/dashboard/
  Dockerfile              # SDK pinata, flutter pub get, target CI
  compose.yaml            # servizi dev-web + ci
  Makefile                # make ci | make dev-web | make shell
  .fvm/fvm_config.json    # stessa versione SDK del Dockerfile
  .tool-versions          # opzionale: mise/asdf flutter
```

### Servizi Compose (target)

| Servizio | Comando | Uso |
|---|---|---|
| `dashboard-ci` | `flutter analyze && flutter test` (+ build web) | CI locale e remota |
| `dashboard-dev-web` | `flutter run -d web-server` + restart su file Dart | Browser `http://127.0.0.1:8080`. Un refresh **non** basta se Flutter non ha ricompilato: aspetta il log `restarting flutter` oppure `make dev-web` di nuovo. |
| `mosquitto` | broker MQTT 1883 + WebSocket 9001 | Opzionale (`make broker`). Non usato da `make ci`. |

Volume bind-mount del sorgente (come micro-flow-editor); cache `pub-cache` in volume
nome per non riscaricare pacchetti ogni volta.

### Gate

Da checkout pulito **solo con Docker**:

```sh
cd software/dashboard
docker compose run --rm dashboard-ci
```

deve passare dopo D011. SDK pinata: **3.32.8** in `.fvmrc`, `.fvm/fvm_config.json` e `FROM ghcr.io/cirruslabs/flutter:3.32.8`.

## Cosa NON va (bene) in Docker

| Target | Perché |
|---|---|
| **iOS / Simulator** | Richiede Xcode su macOS — non buildabile in container Linux |
| **macOS desktop** | Richiede host macOS |
| **Android emulator** | Possibile ma fragile; non obbligatorio fase 1 |
| **Kiosk Raspberry** | Build ARM su host CI o cross-compile dedicato (fase edge, D120) |

Per iOS/Android nativi: stessa versione SDK via **FVM** + README con prerequisiti
(Xcode, Android SDK). Il **gate minimo condiviso** resta Docker (analyze/test/web).

## Alternative ufficiali / comuni

| Strumento | Ruolo |
|---|---|
| **FVM** | Pin SDK nel repo — `fvm install && fvm flutter …` |
| **Dev Containers** (`.devcontainer/`) | Cursor/VS Code apre repo già con Flutter — opzionale D011 |
| **GitHub Actions `subosito/flutter-action`** | CI cloud con channel/version pinati |
| **Melos** | Monorepo `packages/*` + script unificati (se cresce oltre `app/`) |

Dev Container e Docker CI possono condividere lo stesso Dockerfile base.

## Allineamento repo SpaghettiLAB

| Progetto | Pattern |
|---|---|
| `node-red/` | `compose.yaml` + immagine pinata |
| `micro-flow-editor/` | `Dockerfile` + `compose.yaml` + volume `node_modules` |
| `dashboard/` | `Dockerfile` (Cirrus Flutter pin) + `compose.yaml` + FVM + `make ci` |

## Workflow sviluppatore

**Solo UI / web (consigliato all’inizio):**

```sh
docker compose up dashboard-dev-web
# browser → http://127.0.0.1:8080
```

**Nativo (telefono / desktop OS)** — path documentato per D080, **non** eseguito nel gate Docker:

```sh
cd software/dashboard/app
fvm flutter pub get
fvm flutter run -d macos   # o chrome / android se configurato
```

iOS richiede Xcode sull’host; Android l’SDK. Stessa pin **3.32.8**.

**Prima di push:**

```sh
make ci    # equivale a docker compose run dashboard-ci
```

# Roadmap implementazione UI SpaghettiLAB React Flow V1

[Architettura funzionale](../../REACT_FLOW_ARCHITECTURE.md) ·
[Architettura UI/UX](../../UX_ARCHITECTURE.md) · [Roadmap backend](../react-flow-v1/README.md) ·
[Roadmap spec UX](../ux-v1/README.md) · [Schermate](../../ux/screens/)

Questa roadmap implementa in `packages/app` (React + `@xyflow/react` + Motion for
React + Tailwind) ciò che `roadmap/ux-v1/` ha già specificato per intero (tutte le
schermate ✅ come documento) e che i ~25 pacchetti di `roadmap/react-flow-v1/`
espongono come API reale. `ux-v1` produce documentazione, non codice; questa roadmap
produce codice, non nuove decisioni di design — ogni valore visivo/di animazione
viene da `UX_ARCHITECTURE.md` o dal file `visual.md`/`ui-behavior.md` della schermata,
mai inventato qui.

Ogni task collega tre cose già esistenti:

1. Il file `ux/screens/<slug>/visual.md` — layout e token.
2. Il file `ux/screens/<slug>/ui-behavior.md` — animazioni/interazioni locali.
3. Il file `ux/screens/<slug>/backend-behavior.md` — quali funzioni reali dei
   pacchetti `S0NN` chiamare, con che gestione di stato/errore.

Un task è completo quando la schermata è raggiungibile nell'app in esecuzione
(`docker compose up` in `Software/micro-flow-editor/`), rispetta i tre file di
specifica, e passa CI (lint/typecheck/test/build) — verificata visivamente nel
browser quando possibile, non solo per tipo.

## Fasi

| Stato | Task | Schermata | Spec UX | Pacchetti backend usati |
|---|---|---|---|---|
| ✅ | [UI-S010](tasks/UI-S010-workspace-shell.md) | Shell applicativa, Project Picker, undo/redo, command palette | [UX-S010](../ux-v1/tasks/UX-S010-workspace-shell.md) | `domain`, `project-store` |
| ✅ | [UI-S030](tasks/UI-S030-core-connections.md) | Core Connections | [UX-S030](../ux-v1/tasks/UX-S030-core-connections.md) | `core-session`, `protocol-sdk` |
| ✅ | [UI-S040](tasks/UI-S040-catalog-topology.md) | Catalog & Topology Explorer | [UX-S040](../ux-v1/tasks/UX-S040-catalog-topology.md) | `catalog-model`, `editor-model` |
| ✅ | [UI-S050](tasks/UI-S050-physical-composition.md) | Physical Composition Editor | [UX-S050](../ux-v1/tasks/UX-S050-physical-composition.md) | `physical-composition-model`, `react-flow-adapter` |
| ✅ | [UI-S060](tasks/UI-S060-device-profile-studio.md) | Device Profile Studio | [UX-S060](../ux-v1/tasks/UX-S060-device-profile-studio.md) | `device-profile-authoring-model`, `device-profile-package`, `device-profile-install` |
| ⬜ | UI-S070 | Processing Graph Editor | (già "as-built", solo da ricollegare ai pacchetti reali) | `device-processing-graph-model`, `config-compiler`, `config-decompiler` |
| ⬜ | [UI-S080](tasks/UI-S080-deploy-diff.md) | Deploy & Diff | [UX-S080](../ux-v1/tasks/UX-S080-deploy-diff.md) | `config-deployment` |
| ⬜ | [UI-S090](tasks/UI-S090-runtime-diagnostics.md) | Runtime & Diagnostics | [UX-S090](../ux-v1/tasks/UX-S090-runtime-diagnostics.md) | `telemetry-buffer`, `core-actions`, `core-status`, `core-admin` |
| ⬜ | [UI-S100](tasks/UI-S100-capability-marketplace.md) | Capability Marketplace & OTA | [UX-S100](../ux-v1/tasks/UX-S100-capability-marketplace.md) | `capability-marketplace`, `ota-preflight`, `ota-lifecycle` |
| ⬜ | [UI-S110](tasks/UI-S110-cross-core-automation.md) | Cross-Core Automation | [UX-S110](../ux-v1/tasks/UX-S110-cross-core-automation.md) | `system-automation-graph`, `node-red-nodes`, `node-red-deploy` |
| ⬜ | [UI-S120](tasks/UI-S120-settings-security.md) | Settings, Security & Recovery | [UX-S120](../ux-v1/tasks/UX-S120-settings-security.md) | `security-recovery` |

## Ordine

Sequenziale, nello stesso ordine della tabella — ogni schermata successiva assume che
la shell (UI-S010) esista già; oltre a questo, le schermate sono ragionevolmente
indipendenti fra loro (stessa indipendenza dei pacchetti backend da cui dipendono).

## Fondazioni condivise (una tantum, dentro UI-S010)

- **Tailwind CSS** configurato con i token di `UX_ARCHITECTURE.md` come tema esteso
  (colori, spaziatura, radius, font) — non classi arbitrarie sparse nei componenti.
- **Motion for React** (`motion` npm, ex Framer Motion) per gli spring/duration token.
- **Lucide React** per le icone.
- **Font**: Manrope (heading) + Noto Sans (body) via Google Fonts, self-hosted o
  `@fontsource` — mai un CDN esterno bloccante il primo render.
- Layout di shell a tre colonne (top bar/left rail/inspector) come componente
  condiviso, riusato da ogni schermata successiva.

## Gate

Un task è completo quando: la schermata è raggiungibile e funzionale nell'app reale
(non solo componenti isolati), ogni valore visivo/di animazione viene da un token
documentato (mai un numero inventato nel componente), gli stati vuoto/caricamento/
errore del `visual.md` sono implementati (non solo lo stato "popolato" felice), e le
chiamate reali descritte in `backend-behavior.md` sono cablate ai pacchetti veri (mai
dati finti hardcoded in un componente, tranne dove il pacchetto stesso non ha ancora
un'API per quel dato — in tal caso il gap va dichiarato nel task, non nascosto).

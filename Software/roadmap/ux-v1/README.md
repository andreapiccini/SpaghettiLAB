# Roadmap UX SpaghettiLAB V1

[Architettura UI/UX](../../UX_ARCHITECTURE.md) · [Schermate](../../ux/screens/) ·
[Roadmap backend](../react-flow-v1/README.md)

Questa roadmap porta ogni schermata elencata in `UX_ARCHITECTURE.md` dallo stato
"⬜ da scrivere" allo stesso livello di dettaglio già validato per
`ux/screens/S070-processing-graph-editor/` — confermato contro un prototipo React
reale (React Flow + Motion + Tailwind) il 2026-08-12.

**Nessun task qui dipende dalla roadmap backend `react-flow-v1`.** Ogni task produce
solo documentazione (i tre file `visual.md`/`ui-behavior.md`/`backend-behavior.md`),
non codice — può procedere in parallelo o in anticipo rispetto all'implementazione
delle fasi `S0NN` a cui ciascuna schermata è collegata. `backend-behavior.md`
descrive quali comandi/operazioni SDK *dovrebbero* partire una volta che quella fase
esiste, non richiede che esista già.

## Fasi

| Stato | Task | Schermata | Fase backend collegata (riferimento, non dipendenza) |
|---|---|---|---|
| ✅ | — | Processing Graph Editor | S071–S073 (già scritta, è il campione di formato) |
| ✅ | [UX-S010](tasks/UX-S010-workspace-shell.md) | Project/Workspace Shell | S011–S014 |
| ✅ | [UX-S030](tasks/UX-S030-core-connections.md) | Core Connections | S030 |
| ✅ | [UX-S040](tasks/UX-S040-catalog-topology.md) | Catalog & Topology Explorer | S041–S043 |
| ✅ | [UX-S050](tasks/UX-S050-physical-composition.md) | Physical Composition Editor | S050 |
| ✅ | [UX-S060](tasks/UX-S060-device-profile-studio.md) | Device Profile Studio | S061–S063 |
| ✅ | [UX-S080](tasks/UX-S080-deploy-diff.md) | Deploy & Diff | S080 |
| ✅ | [UX-S090](tasks/UX-S090-runtime-diagnostics.md) | Runtime & Diagnostics | S091–S094 |
| ⬜ | [UX-S100](tasks/UX-S100-capability-marketplace.md) | Capability Marketplace & OTA | S101–S103 |
| ⬜ | [UX-S110](tasks/UX-S110-cross-core-automation.md) | Cross-Core Automation | S111–S113 |
| ⬜ | [UX-S120](tasks/UX-S120-settings-security.md) | Settings, Security & Recovery | S121–S124 |

## Convenzione

Ogni task produce la cartella `ux/screens/<slug>/` con esattamente tre file:

1. `visual.md` — layout, componenti, stati (vuoto/caricamento/errore/popolato). Ogni
   valore (colore, spaziatura, font, raggio, ombra) deve essere uno dei token
   definiti in `UX_ARCHITECTURE.md`, mai un numero inventato lì per lì.
2. `ui-behavior.md` — animazioni e interazioni locali, usando i token di
   `UX_ARCHITECTURE.md` § Sistema di animazione. Non deve mai menzionare una
   chiamata di rete/SDK — quella parte vive solo in `backend-behavior.md`. Questo è
   il punto esplicitamente richiesto fin dall'inizio: cosa succede nell'interfaccia
   prima e indipendentemente dal backend.
3. `backend-behavior.md` — quale comando di dominio o operazione SDK partirebbe,
   riferendosi ai task `S0NN` reali della roadmap backend (anche se non ancora
   implementati) per ogni operazione — mai una descrizione generica.

## Gate

Un task è completo quando i tre file esistono, seguono il formato di
`S070-processing-graph-editor`, e la riga corrispondente nella tabella schermate di
`UX_ARCHITECTURE.md` passa da "⬜ da scrivere" a "✅".

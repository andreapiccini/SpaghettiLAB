# SpaghettiLAB Software

## Componenti

- [`micro-flow-editor`](micro-flow-editor/) — applicazione React Flow per configurare,
  aggiornare, osservare e diagnosticare i Core e per costruire automazioni deployate
  verso Node-RED.
- [`node-red`](node-red/) — runtime host per collegamenti fra Core, integrazioni e
  automazioni che non appartengono al runtime locale firmware.

## Specifica React Flow V1

- [Architettura funzionale](REACT_FLOW_ARCHITECTURE.md)
- [Roadmap completa](roadmap/react-flow-v1/README.md)

La specifica non impone design grafico. Congela funzioni, modelli, protocolli, flussi,
errori, sicurezza e criteri di verifica necessari a ottenere la prima versione
completa; la UI viene derivata da tali necessità.

## Architettura UI/UX

- [Architettura UI/UX](UX_ARCHITECTURE.md) — shell applicativa, elenco schermate,
  design token e convenzioni condivise.
- [`ux/screens/`](ux/screens/) — una cartella per schermata, ciascuna divisa in
  `visual.md` (aspetto), `ui-behavior.md` (comportamento d'interfaccia prima del
  backend) e `backend-behavior.md` (quale comando/operazione SDK parte davvero). La
  separazione permette di modificare una feature senza toccare le altre, e un layer
  senza rischiare gli altri due.
- [Roadmap UX](roadmap/ux-v1/README.md) — un task per schermata ancora da scrivere,
  indipendente dalla roadmap backend (nessuna dipendenza dal protocollo firmware).


# Roadmap React Flow SpaghettiLAB V1

[Architettura funzionale](../../REACT_FLOW_ARCHITECTURE.md) ·
[Editor esistente](../../micro-flow-editor/README.md) ·
[Copertura funzionale](FUNCTIONAL_COVERAGE.md)

Questa roadmap porta il prototipo React Flow esistente a una prima versione completa.
Non contiene design visuale: ogni fase definisce comportamento, contratti, errori,
persistenza e verifiche.

## Fasi

| Stato | Fase | Risultato |
|---|---|---|
| ⬜ | [S010 — Fondazioni e dominio](tasks/S010-foundations-domain.md) | Workspace, Project, ID, errori, migration e confini dei tre grafi sono congelati. |
| ⬜ | [S020 — Protocol SDK e trasporti](tasks/S020-protocol-sdk-transports.md) | Il software parla Protocol V1 lossless con retry, paginazione e record stream. |
| ⬜ | [S030 — Sessioni Core e sincronizzazione](tasks/S030-core-sessions-sync.md) | Più Core vengono connessi, identificati e sincronizzati senza sovrascritture implicite. |
| ⬜ | [S040 — Catalogo, topologia e adapter React Flow](tasks/S040-catalog-topology-editor-model.md) | Nodi, handle e proprietà derivano dal firmware senza tipi concreti hardcoded. |
| ⬜ | [S050 — Composizione fisica e configurazione Module](tasks/S050-physical-composition-modules.md) | Backbone, Bay, Connector, sensori esterni e Module diventano Config validabile. |
| ⬜ | [S060 — Device Profile Studio](tasks/S060-device-profile-studio.md) | Un nuovo sensore compatibile viene descritto, validato e installato senza OTA. |
| ⬜ | [S070 — Processing graph e compilatore Config](tasks/S070-processing-graph-compiler.md) | Blocchi locali, schedule, Rule ed edge diventano Config canonico bounded. |
| ⬜ | [S080 — Deploy transazionale](tasks/S080-config-deployment.md) | Diff, validate, CAS, conflict resolution e verifica post-apply sono completi. |
| ⬜ | [S090 — Runtime, discovery e diagnostica](tasks/S090-runtime-diagnostics.md) | Record, comandi, discovery, health, risorse e perdite sono osservabili. |
| ⬜ | [S100 — Capability Pack e OTA](tasks/S100-capability-packs-ota.md) | Feature mancanti vengono risolte con immagini firmate e catalogo risincronizzato. |
| ⬜ | [S110 — Automazioni cross-Core con Node-RED](tasks/S110-node-red-cross-core.md) | Output e comandi di Core distinti vengono collegati e deployati in Node-RED. |
| ⬜ | [S120 — Sicurezza, portabilità e recovery](tasks/S120-security-portability-recovery.md) | Segreti, import/export, audit, backup e recovery sono qualificati. |
| ⬜ | [S130 — Chiusura V1 end-to-end](tasks/S130-v1-finalization.md) | Tutti i percorsi funzionano con dispositivi/servizi fake e almeno un Core reale. |

## Dipendenze

```text
S010 → S020 → S030 → S040 → S050 → S060
                         └──────→ S070 → S080 → S090 → S100
                                                   └──────→ S110
S010 ─────────────────────────────────────────────────────→ S120
S100 + S110 + S120 ───────────────────────────────────────→ S130
```

S050 e S060 possono procedere in parallelo dopo S040. S120 introduce regole fin
dall'inizio ma chiude i test di sicurezza e recovery dopo i flussi operativi.

## Decisioni congelate

1. Il dominio non dipende da React Flow.
2. Physical, Device Processing e System Automation Graph hanno ownership separate.
3. Il catalogo del Core è l'autorità sui tipi installati.
4. Device Profile compatibili sono dati; Capability Pack richiedono OTA firmato.
5. Il progetto non contiene segreti né stato runtime effimero.
6. Il deploy Config usa sempre validate e compare-and-swap.
7. Un conflitto non viene risolto con last-write-wins automatico.
8. Node-RED esegue collegamenti cross-Core; il Core esegue comportamento locale bounded.
9. Le risorse sono capacità/uso/high-water nominati, non una `free_ram` generica.
10. Nessun nodo concreto è hardcoded quando il catalogo può descriverlo.
11. L'app non installa codice non firmato nel Core.
12. Nessuna funzione indicata dall'architettura resta rinviata oltre S130.

## Gate finale

La V1 non è conclusa finché tutte le checklist S010–S130 sono complete e lo scenario
end-to-end di S130 passa integralmente. Una funzione può essere esclusa soltanto se il
Core dichiara esplicitamente la capability assente; l'app deve comunque rappresentare
l'assenza e spiegare il percorso di risoluzione.

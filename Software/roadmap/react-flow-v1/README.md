# Roadmap React Flow SpaghettiLAB V1

[Architettura funzionale](../../REACT_FLOW_ARCHITECTURE.md) ·
[Editor esistente](../../micro-flow-editor/README.md) ·
[Copertura funzionale](FUNCTIONAL_COVERAGE.md)

Questa roadmap porta il prototipo React Flow esistente a una prima versione completa.
Non contiene design visuale: ogni fase definisce comportamento, contratti, errori,
persistenza e verifiche.

Le fasi più dense sono state divise in sottotask (`S0N1`, `S0N2`, ...): ogni sottotask
copre un sottosistema verificabile da solo, con una propria checklist e un proprio gate.
Una fase resta un unico task quando i suoi passi sono aspetti sequenziali dello stesso
meccanismo (S030, S050, S080) o quando dividerla ne vanificherebbe lo scopo (S130, gate
finale end-to-end).

## Fasi

| Stato | Fase | Risultato |
|---|---|---|
| | **S010 — Fondazioni e dominio** | |
| ✅ | [S011 — Workspace, tooling e porte infrastrutturali](tasks/S011-workspace-tooling-ports.md) | Workspace multi-pacchetto, quality gate e porte astratte sono pronti. |
| ✅ | [S012 — Tipi di dominio, ID ed errori strutturati](tasks/S012-domain-types-errors.md) | Ogni entità ha ID stabile; gli errori di dominio sono strutturati, non stringhe. |
| ✅ | [S013 — I tre grafi e i confini fra layer](tasks/S013-graph-boundaries.md) | Physical, Device Processing e System Automation Graph hanno ownership separata. |
| ✅ | [S014 — ProjectV1, persistenza e comandi con undo/redo](tasks/S014-project-persistence-commands.md) | Project è persistibile, versionato e modificabile con undo/redo deterministico. |
| | **S020 — Protocol SDK e trasporti** | |
| ✅ | [S021 — Codec e tipi Protocol V1](tasks/S021-codec-protocol-types.md) | Ogni tipo Protocol V1 ha codec CBOR lossless testato su golden vector. |
| ✅ | [S022 — SpaghettiClient e operazioni firmware](tasks/S022-spaghetti-client-operations.md) | Ogni operazione firmware è raggiungibile da un client con retry/correlation/paginazione corretti. |
| ✅ | [S023 — Adapter di trasporto](tasks/S023-transport-adapters.md) | MQTT e WebSocket/BLE producono gli stessi oggetti di dominio. |
| ✅ | [S024 — Streaming eventi e fixture fake](tasks/S024-event-streaming-fixtures.md) | Streaming con backpressure/gap espliciti; l'app si sviluppa senza hardware fisico. |
| ✅ | [S030 — Sessioni Core e sincronizzazione](tasks/S030-core-sessions-sync.md) | Più Core vengono connessi, identificati e sincronizzati senza sovrascritture implicite. |
| | **S040 — Catalogo, topologia e adapter React Flow** | |
| ✅ | [S041 — Normalizzazione catalogo e topologia](tasks/S041-catalog-topology-normalization.md) | Catalog e topologia diventano indici immutabili indipendenti dall'ordine di lettura. |
| ✅ | [S042 — EditorModel, form e compatibility engine](tasks/S042-editor-model-compatibility.md) | Nodi, handle, form e vincoli di collegamento derivano dal catalogo, mai hardcoded. |
| ✅ | [S043 — Adapter React Flow](tasks/S043-react-flow-adapter.md) | React Flow è pura rappresentazione; il dominio resta l'unica fonte autorevole. |
| ✅ | [S050 — Composizione fisica e configurazione Module](tasks/S050-physical-composition-modules.md) | Backbone, Bay, Connector, sensori esterni e Module diventano Config validabile. |
| | **S060 — Device Profile Studio** | |
| ✅ | [S061 — Modello authoring ed editor istruzioni](tasks/S061-profile-authoring-instructions.md) | Un profilo si descrive interamente con le istruzioni catalogate disponibili. |
| ✅ | [S062 — Budget locale, import/export e resolver](tasks/S062-profile-budget-export-resolver.md) | Il profilo è verificato localmente, scambiabile e risolto in uno dei sei esiti previsti. |
| ✅ | [S063 — Installazione, catalogo e sorgenti profilo](tasks/S063-profile-install-catalog-sources.md) | Un sensore compatibile viene installato e istanziato come Module senza OTA. |
| | **S070 — Processing graph e compilatore Config** | |
| ⬜ | [S071 — Authoring e validazione del processing graph](tasks/S071-processing-graph-authoring.md) | Il grafo locale rifiuta cicli, riferimenti dangling ed edge cross-Core. |
| ⬜ | [S072 — Compilatore Config deterministico](tasks/S072-config-compiler.md) | Il grafo validato compila in Config canonico, deterministico, senza dettagli React Flow. |
| ⬜ | [S073 — Decompilatore e dry-run](tasks/S073-decompiler-dry-run.md) | Config live → grafo funzionale e verifica dry-run completa prima del deploy. |
| ⬜ | [S080 — Deploy transazionale](tasks/S080-config-deployment.md) | Diff, validate, CAS, conflict resolution e verifica post-apply sono completi. |
| | **S090 — Runtime, discovery e diagnostica** | |
| ⬜ | [S091 — Subscription telemetria, decodifica e buffering](tasks/S091-telemetry-subscription-buffering.md) | Record ed eventi sono ricevuti con provenienza e gap sempre espliciti. |
| ⬜ | [S092 — Command runner e discovery](tasks/S092-command-runner-discovery.md) | Comandi manuali e discovery restano nettamente distinti dal Config. |
| ⬜ | [S093 — Stato, health e resource monitor](tasks/S093-status-health-resources.md) | Stato e risorse del Core sono leggibili col significato dato dal firmware. |
| ⬜ | [S094 — Operazioni amministrative autorizzate](tasks/S094-admin-operations.md) | Connectivity, lease, maintenance e reset scope hanno permessi e conferme adeguati. |
| | **S100 — Capability Pack e OTA** | |
| ⬜ | [S101 — Marketplace catalog e dependency resolver](tasks/S101-marketplace-dependency-resolver.md) | Pack disponibili, installati e richiesti restano distinti; il resolver motiva ogni esito. |
| ⬜ | [S102 — Preflight e budget risorse](tasks/S102-ota-preflight-resources.md) | Un candidato è verificato per compatibilità e risorse prima di trasferire byte. |
| ⬜ | [S103 — State machine OTA, postflight e audit](tasks/S103-ota-state-machine-postflight.md) | L'aggiornamento non lascia mai un Core in stato "installato" falso. |
| | **S110 — Automazioni cross-Core con Node-RED** | |
| ⬜ | [S111 — System Automation Graph e compatibility engine](tasks/S111-system-automation-graph.md) | I collegamenti cross-Core sono rappresentati con identità stabile, mai runtime ID. |
| ⬜ | [S112 — Package nodi Node-RED SpaghettiLAB](tasks/S112-node-red-node-package.md) | I nodi Node-RED reali condividono lo stesso SDK Protocol dell'app. |
| ⬜ | [S113 — Compiler, Admin API deploy e diagnostica runtime](tasks/S113-node-red-compiler-deploy.md) | Il grafo autore diventa un deploy Node-RED revisionato, scoped e osservabile. |
| | **S120 — Sicurezza, portabilità e recovery** | |
| ✅ | [S121 — Credential store e permission matrix](tasks/S121-credential-permission.md) | Nessun segreto entra in progetto/log/errore; i permessi sono verificati prima dell'azione. |
| ✅ | [S122 — Persistenza robusta: autosave, backup e concorrenza](tasks/S122-persistence-recovery.md) | Crash, migration fallita e tab concorrenti non perdono mai lavoro. |
| ✅ | [S123 — Import/export sicuri, redaction e audit](tasks/S123-import-export-audit.md) | Import/export non eseguono codice non trusted; ogni operazione sensibile è auditata. |
| ⬜ | [S124 — Conferme distruttive, recovery guidato e threat test](tasks/S124-destructive-confirm-recovery-threats.md) | Ogni azione irreversibile è confermata; ogni scenario di guasto ha un recovery testato. |
| ⬜ | [S130 — Chiusura V1 end-to-end](tasks/S130-v1-finalization.md) | Tutti i percorsi funzionano con dispositivi/servizi fake e almeno un Core reale. |

## Dipendenze

```text
S011 → S012 → S013 → S014
                        │
S021 → S022 ─┐          │
S021 → S023 ─┴→ S024 ←──┘
                 │
                S030
                 │
S041 → S042 → S043
                 │
                S050 ───────────────┐
                 │                  │
        S061 → S062 → S063          │
                 │                  │
                 └──→ S071 → S072 → S073 → S080
                                              │
                              S091 ───────────┤
                               ├──→ S092 → S094
                               └──→ S093
                                              │
                    S063 → S101 → S102 ←── S093
                                    │
                                   S103
                                              │
        S111 (da S043,S080,S093) → S112 → S113
                                              │
S014 → S121 ─┬→ S122 ─┐
              └→ S123 ─┴→ S124 (chiusura dopo S103, S113)
                                              │
        S011–S124, S030, S050, S080 ────────→ S130
```

S050 e S061–S063 possono procedere in parallelo dopo S043. S092/S093 procedono in
parallelo dopo S091. S122/S123 procedono in parallelo dopo S121. S120 introduce regole
fin dall'inizio (dipende solo da S014) ma S124 chiude i test di sicurezza e recovery
dopo i flussi operativi (S103, S113).

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
13. Dividere una fase in sottotask non cambia il suo contratto: la somma delle
    checklist dei sottotask deve coprire esattamente i requisiti della fase originale.

## Gate finale

La V1 non è conclusa finché tutte le checklist S011–S124 (più S030, S050, S080) sono
complete e lo scenario end-to-end di S130 passa integralmente. Una funzione può essere
esclusa soltanto se il Core dichiara esplicitamente la capability assente; l'app deve
comunque rappresentare l'assenza e spiegare il percorso di risoluzione.

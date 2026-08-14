# Copertura funzionale React Flow V1

[← Roadmap](README.md)

Questa matrice impedisce che una funzione dell'architettura rimanga senza owner o gate.
Il design visuale è intenzionalmente escluso; accessibilità funzionale e operabilità
senza solo drag-and-drop restano requisiti di S130.

| Funzione | Implementazione | Gate finale |
|---|---|---|
| Progetti, ID, migration, undo/redo | S012, S014 | S130.1, S130.16 |
| Import/export senza segreti | S014, S123 | S130.16, S130.20 |
| Codec Protocol/CBOR lossless | S021 | contract/golden S130 |
| MQTT e WebSocket/BLE gateway | S023 | scenario multi-transport S130 |
| Più Core e reconnect | S030 | S130.2, S130.11 |
| Catalog fingerprint e cache | S030, S041 | S130.6, S130.17 |
| Nodi/handle/form catalog-driven | S042 | S130.17 |
| Topologia Flow/Port/Bay/rail | S041, S050 | S130.3 |
| Backbone, Power, Core, Bay, Connector | S050 | S130.3 |
| Sensore esterno e cablaggio logico | S050 | S130.3 |
| Label e raggruppamento sensore/interfaccia | S050 | S130.3–5 |
| Module, endpoint, indirizzi e collisioni | S050 | S130.3, S130.8 |
| Discovery manuale/automatica | S050, S092 | S130.15 |
| Device Profile no-code | S061 | S130.4 |
| Registri I2C/SPI/UART/GPIO/ADC | S061 | S130.4 |
| 1-Wire via profilo (Port W1) | S064, firmware 393 | S130.4 |
| Init, wait, CRC, conversioni base | S061 | S130.4 |
| Install profilo senza OTA | S063 | S130.4 |
| Schedule, eventi, Rule e comandi | S071 | S130.5, S130.15 |
| Blocchi elaborazione e filtri | S071, S074 | S130.5, S130.7 |
| Compilazione Config deterministica | S072 | S130.5, S130.7 |
| Validate/diff/apply CAS | S080 | S130.7, S130.12 |
| Conflitto e modifiche esterne | S080 | S130.12 |
| Record/eventi/drop/boot ID | S091 | S130.10–11 |
| Comandi manuali catalogati | S092 | S130.15 |
| Health, reset, job, audit firmware | S093 | S130.14–15 |
| Connectivity, lease, maintenance | S094 | S130.15 |
| Flash e image headroom | S093, S102 | S130.14 |
| RAM statica, stack, pool/workspace/high-water | S093 | S130.14 |
| Marketplace feature/profile | S063, S101, S104 | S130.4, S130.6 |
| Dependency e compatibility resolver | S062, S101 | S130.6 |
| Capability Pack Modbus/Kalman | S101 | S130.6–7 |
| OTA firmato e progress | S103 | S130.6 |
| Trial, confirm e rollback | S103 | S130.13 |
| Config/profile preservati dopo OTA | S103 | S130.13 |
| Immagine universale vs pack opzionali | S102 | manifest/resource test S130 |
| Collegamento temperatura Core A→display Core B | S113 | S130.9–10 |
| Custom nodes e SDK Node-RED | S112 | S130.9 |
| Deploy Node-RED revisionato e scoped | S113 | S130.9, S130.18 |
| Core/Node-RED offline | S113 | S130.11 |
| Credential store e permission | S121 | S130.1, S130.15, S130.20 |
| Backup, autosave e crash recovery | S122 | S130.16, S130.19 |
| Import/profile/marketplace non trusted | S123 | security/fuzz S130 |
| Device replacement e ID mismatch | S124 | S130.19 |
| Nessun tipo concreto hardcoded | S042 e tutte le estensioni | S130.17 |

## Regola di chiusura

Una riga può essere marcata completa soltanto quando il task di implementazione e il
gate S130 associato passano. Spostare una funzione fuori dalla V1 richiede una modifica
esplicita dell'architettura, della matrice e dello scenario finale; non basta lasciarla
come TODO nel codice.

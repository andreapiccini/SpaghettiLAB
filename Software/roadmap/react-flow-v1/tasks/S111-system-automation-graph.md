# S111 — System Automation Graph e compatibility engine

**Stato:** ✅ DONE
**Dipende da:** S043, S080, S093

## Obiettivo

Definire come si rappresenta un collegamento fra Core distinti, senza ancora generare
alcun nodo Node-RED reale.

## Implementazione richiesta

1. Definisci System Automation Graph con endpoint `Core record field`, `Core command`,
   Node-RED processing/integration e stato connection; usa device ID + stable key +
   schema/field/command, mai runtime ID.
2. Implementa catalogo unificato dei Core disponibili e compatibility engine per tipi,
   unità e comando. Un link temperatura→display deve dichiarare trasformazione quando
   gli schemi differiscono.

## Verifiche

- un endpoint del grafo referenzia sempre device ID + stable key, mai un ID di
  sessione effimero;
- un link fra schemi con unità incompatibili richiede una trasformazione esplicita,
  non converte implicitamente;
- un catalog change su un Core coinvolto rende stale i link finché non vengono
  rivalidati.

## Fine task

- [x] Il System Automation Graph rappresenta ogni collegamento cross-Core previsto.
- [x] Nessun link può referenziare stato effimero non stabile fra riconnessioni.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/system-automation-graph`
(`Software/micro-flow-editor/packages/system-automation-graph/`), che dipende solo da
`domain` — stesso principio "dominio puro, nessun protocol-sdk/React" già seguito da
`device-processing-graph-model`.

**Endpoint** (`endpoints.ts`): tre varianti — `RecordFieldEndpoint`, `CommandEndpoint`,
`NodeRedEndpoint` — che referenziano sempre `CoreBindingId` (già esistente in `domain`,
legato a `CoreBindingRecord.expectedDeviceId`, stabile per progetto) più la key
Config-assegnata stabile (`sourceKey`/`moduleKey`), mai un handle di sessione runtime.
Vale a livello di tipo: nessun campo su nessun endpoint può portare un ID effimero.

**Registro campi/comandi** (`field-registry.ts`) — gap wire onesto: i metadati
tipo/unità non sono mai osservabili sul wire Protocol V1 (già documentato dal README di
`catalog-model`, S041 — ogni schema descriptor è vuoto). `FieldRegistry` è quindi
sempre fornito dal chiamante, mai inventato.

**Compatibility engine** (`compatibility.ts`): `checkFieldCompatibility()` confronta
`valueType`/`unit`; qualunque differenza richiede una `transformation` esplicita non
vuota, altrimenti `INCOMPATIBLE` — nessun ramo converte mai implicitamente.

**Link** (`link.ts`): `createSystemAutomationLink()` rifiuta di costruire il link se
incompatibile senza trasformazione dichiarata, o se il registro non risolve un
endpoint (`UNKNOWN_FIELD`, mai "assumi compatibile"). Un endpoint Node-RED salta il
controllo di compatibilità sul proprio lato — è esso stesso il punto di
trasformazione/integrazione.

**Staleness** (`staleness.ts`): ogni link porta `validatedFingerprints` (il vero
`fingerprint` di `GET_CATALOG`, lo stesso campo su cui già si basa
`CatalogCache` di `core-session`) per ogni `CoreBinding` coinvolto. `revalidateLink()`
confronta con una lettura fresca fornita dal chiamante e riporta `STALE` nominando
esattamente quali Core sono cambiati; `markLinkRevalidated()` è l'unico modo per
tornare `VALID`.

**Catalogo unificato** (`unified-catalog.ts`): `UnifiedCoreCatalogEntry` per ogni
`CoreBindingId` noto al progetto — nessun I/O in questo pacchetto, costruito lato app da
`core-session` (raggiungibilità) e da un registro campi derivato da Device
Profile/catalogo Block. `toFieldRegistry()` fa da ponte diretto verso
`createSystemAutomationLink()`.

**Test**: 21 nuovi test coprono direttamente le tre Verifiche (endpoint sempre
device ID + stable key mai session ID effimero — garantito a livello di tipo; link
temperatura→display con unità incompatibili rifiutato senza trasformazione esplicita;
catalog change su un Core coinvolto rende stale il link finché non rivalidato). CI
completa verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): nessuna
generazione di nodi Node-RED reali (per disegno — arriva con S112/S113); metadati
tipo/unità sempre forniti dal chiamante; la risoluzione cross-catalogo di
`toFieldRegistry()` è una comodità per l'authoring UI, non un resolver
per-Core-preciso.

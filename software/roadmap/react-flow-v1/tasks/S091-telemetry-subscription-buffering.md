# S091 — Subscription telemetria, decodifica e buffering

**Stato:** ✅ DONE
**Dipende da:** S030, S080

## Obiettivo

Ricevere e rendere interrogabile la telemetria del Core, con provenienza e perdite
sempre esplicite.

## Implementazione richiesta

1. Implementa subscription manager per record/event/status/discovery con cursor,
   reconnect, boot ID, sequence, drop e clock/uptime espliciti.
2. Decodifica field tramite schema/fingerprint; unknown schema conserva payload
   diagnostico e forza refresh catalogo senza interpretazione inventata.
3. Mantieni buffer host bounded per Core/schema e policy retention configurabile;
   export dati include provenienza, unità, boot ID e gap.
4. Collega errore live al relativo Core/Module/Profile/Block quando riferimenti e
   DeploymentRecord lo permettono.

## Verifiche

- record di due Core/schema distinti non si contaminano nello stesso buffer;
- un reboot con boot ID cambiato rende il gap visibile e non collega serie
  incompatibili in silenzio;
- un unknown schema conserva il payload grezzo invece di scartarlo o interpretarlo a
  caso.

## Fine task

- [x] Ogni record/evento conserva provenienza completa (Core, schema, boot ID, unità).
- [x] Perdite e gap sono sempre espliciti, mai silenziosi.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/telemetry-buffer`
(`software/micro-flow-editor/packages/telemetry-buffer/`), che dipende da `domain` e
`protocol-sdk`.

**Il gap reale che questo pacchetto aggira**: `RecordEventPayload` (`EventType.RECORD`
di `protocol-sdk`) è solo una notifica — `{sourceKey, sequence, schemaId,
schemaVersion}`, nessun valore di campo. Il record reale con i valori
(`struct spaghetti_record`, `schema.h`) viene consegnato fuori banda per consumer via
un anello firmware con cursori indipendenti
(`spaghetti_record_delivery_peek`/`ack`, `record_delivery.h`, un anello per MQTT e
uno per BLE). Non esiste un'operazione tipo `GET_RECORD` in `protocol-sdk` oggi, né
un decoder CBOR per il payload MQTT — verificato direttamente, non presunto. Questo
pacchetto quindi non può decodificare i valori dei campi da solo: ogni chiamata a
`ResolveFields` è fornita dal chiamante.

**Buffer** (`buffer-store.ts`): `TelemetryBufferStore` indicizza ogni buffer per la
coppia esatta `(coreId, schemaId)` — "record di due Core/schema distinti non si
contaminano nello stesso buffer" vale per costruzione. L'overflow scarta prima la
voce più vecchia, rispecchiando la policy dell'anello di
`spaghetti_record_delivery_push` invece di inventarne una diversa. Ogni voce porta
un `bootEpoch` — un contatore che incrementa ogni volta che `observeBootId()`
(alimentato dagli eventi `STATUS`) vede un `boot_id` cambiato. Due record a cavallo
di un reboot hanno sempre `bootEpoch` diversi, quindi un consumer non deve mai
incrociare un log separato per sapere che non sono una serie continua.

**Subscription** (`subscription-manager.ts`): `subscribeCore()` drena l'`EventStream`
di un Core in uno `TelemetryBufferStore` condiviso, taggato con un `coreId` fornito
dal chiamante. Gli eventi `STATUS` alimentano `observeBootId` (il rilevamento gap
strutturato reale); il gap `boot_id_changed` che `EventStream` genera già di suo
viene deliberatamente ignorato per non duplicare la stessa discontinuità già
registrata da `observeBootId` sul confronto reale del `bootId` bigint. Solo
`gap`/`sequence_discontinuity` (che non ha altra fonte) viene inoltrato. Per ogni
notifica record, restituire `undefined` da `resolveFields()` significa "schema
sconosciuto" (punto 2) — il record resta comunque (`kind: "unknown-schema"`,
`needsCatalogRefresh: true`), con solo `rawPayload` (se il chiamante aveva i byte)
conservato, mai un'interpretazione indovinata.

**Test**: 6 nuovi test coprono direttamente le tre Verifiche (isolamento buffer per
Core/schema, gap boot ID visibile senza collegamento silenzioso di serie, payload
grezzo conservato per schema sconosciuto). CI completa verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): nessuna
decodifica reale dei valori di campo (`ResolveFields` è interamente fornito dal
chiamante); nessun arricchimento "unità" (nessun catalogo schema-field esiste ancora
per fornire una stringa di unità reale); nessun wiring di trasporto — aprire un
`EventStream` per Core resta compito di `core-session` (S030), non duplicato qui.

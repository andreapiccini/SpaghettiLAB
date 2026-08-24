# S073 — Decompilatore e dry-run

**Stato:** ✅ DONE
**Dipende da:** S072

## Obiettivo

Permettere il percorso inverso (Config live → grafo autore) e una verifica completa
prima di qualunque deploy reale.

## Implementazione richiesta

1. Implementa decompiler/import dal Config live verso un grafo funzionale, marcando ciò
   che non può recuperare metadata authoring senza inventarli.
2. Fornisci dry-run completo con elenco errori/warning e remediation per profilo o pack
   assente.

## Verifiche

- un ciclo decompile→compile su un Config supportato conserva la semantica originale;
- il decompiler non inventa mai metadata di authoring che non può recuperare (li
  lascia esplicitamente assenti);
- il dry-run elenca ogni errore/warning con remediation, senza interrompersi al primo.

## Fine task

- [x] Decompiler e dry-run sono puri e indipendenti dalla UI.
- [x] Un Config supportato sopravvive a un ciclo decompile→compile senza perdita
      semantica.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/config-decompiler`
(`software/micro-flow-editor/packages/config-decompiler/`), che dipende da `domain`,
`protocol-sdk`, `config-compiler` (S072), `physical-composition-model` (S050) e
`device-processing-graph-model` (S071).

**Correzione a S071/S072 fatta prima di procedere** (non solo un gap futuro):
costruendo il compilatore contro `struct spaghetti_edge_config` ho confermato che
`target_key` sul wire è **sempre** una Block key — una Rule non ha alcuna porta di
input per ricevere un edge, legge la propria sorgente nello stesso modo in cui
dichiara la propria azione, per riferimento a campo nelle proprie `properties`
(dispatch `on_record`). Una prima revisione permetteva edge verso le Rule. Aggiunto
`RuleNodeData.sourceReference` (rispecchia `commandTarget`) in
`device-processing-graph-model`, il validatore ora rifiuta ogni edge il cui target è
una Rule (`RULE_AS_EDGE_TARGET`), e `config-compiler` risolve `target_key` solo verso
Block, mai Rule.

**Decode** (`decode-config-cbor.ts`): inversa esatta di `encodeConfigCbor` di S072,
stessa fonte (`decode_wire_v3` in `config_cbor.c`). Costruendola, `protocol-sdk`'s
`CborReader` ha guadagnato supporto per il simple value CBOR 22 (`0xF6`, `null`) —
necessario per decodificare un `bay_id`/`power_rail_id` non specificato
(`encode_optional_u8`), che il decoder condiviso prima non gestiva affatto.

**Decompile** (`decompile.ts`): produce `{physicalGraph, processingGraph}` da un
`CanonicalConfig`. ID nodo sintetizzati (`module-00001`, ...) con padding a zero
così l'ordinamento lessicografico (da cui `compileConfig` deriva le key) corrisponde
sempre all'ordine numerico, indipendentemente da quante voci esistono — altrimenti un
ciclo decompile→ricompila avrebbe potuto riassegnare key diverse superate le 9 voci
per categoria. Non inventa mai metadata di authoring: `AuthoringMetadata` non esiste
affatto in Config e questa funzione non tocca quello store. Due campi hanno bisogno di
gestione esplicita perché richiesti strutturalmente ma assenti da Config:
`electricalMode` (non fa parte di `spaghetti_module_config`, mai sopravvive alla
compilazione — impostato a `"input-output"` con un issue di severità `"warning"`
esplicito, mai in silenzio) e `profileId` (non recuperabile, lasciato assente con un
warning). Un Module senza `bay_id`/`power_rail_id` recuperabile non viene
rappresentato affatto — segnalato come issue di severità `"error"`, mai inventato.
Schedule vs Event-source è inferito (non indovinato oltre il segnale disponibile): un
Module usato come sorgente edge senza una voce `schedules[]` corrispondente è l'unica
altra possibilità che questo stesso compilatore produce.

**Dry-run** (`dry-run.ts`): esegue `compileConfig()` e, indipendentemente, verifica
che ogni Device Profile / tipo Block-Rule referenziato sia disponibile
(`availableProfileIds`/`availableBlockRuleTypeIds`, entrambi forniti dal chiamante).
Ogni problema trovato viene restituito, errore o warning, senza mai fermarsi al
primo; `compiled` è presente solo quando non esiste alcun issue di severità
`"error"` — un dry-run con soli warning produce comunque un Config utilizzabile.

**Test**: 12 nuovi test coprono direttamente le tre Verifiche (ciclo decompile→
compile che preserva la semantica, nessun metadata authoring inventato, dry-run che
elenca tutti gli errori/warning senza fermarsi al primo) più 2 nuovi test di
correzione in `device-processing-graph-model` (15 test totali, da 13). CI completa
verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto):
ricostruzione `commandTarget`/`sourceReference` della Rule è fornita dal chiamante,
stesso pattern del compilatore; nessuna risoluzione nome-proprietà→field-id; gli ID
nodo sintetizzati non corrispondono mai agli UUID di una sessione di authoring
originale (Config non porta identità di authoring, solo key intere).

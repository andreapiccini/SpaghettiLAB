# S062 — Budget locale, import/export e resolver

**Stato:** ✅ DONE
**Dipende da:** S061

## Obiettivo

Rendere un profilo autore verificabile localmente, scambiabile come pacchetto, e capire
se un Core può accoglierlo prima di qualunque azione remota.

## Implementazione richiesta

1. Calcola localmente worst-case operation count, byte, timeout, temporanei e output;
   confronta con limiti Core prima della validate remota.
2. Implementa import/export del package profilo canonico con ID, versione, hash,
   autore, compatibilità e dipendenze opcode; non eseguire contenuto importato.
3. Implementa resolver `READY/PROFILE_INSTALL_REQUIRED/FIRMWARE_UPDATE_REQUIRED/
   HARDWARE_INCOMPATIBLE/RESOURCE_INCOMPATIBLE/VERSION_CONFLICT`.

## Verifiche

- un opcode assente propone Capability Pack e non tenta un'installazione dati;
- un profilo esportato e reimportato produce lo stesso hash;
- import di un package con dipendenze opcode dichiarate ma non installate risolve a
  `FIRMWARE_UPDATE_REQUIRED`, non a un falso `READY`.

## Fine task

- [x] Il resolver copre tutti gli esiti definiti dall'architettura.
- [x] Revisione/hash del pacchetto impediscono cambiamenti silenziosi.

## Implementazione (2026-08-13)

Nuovo pacchetto `@spaghettilab/device-profile-package`
(`Software/micro-flow-editor/packages/device-profile-package/`), che dipende da
`domain`, `device-profile-authoring-model` (S061) e `protocol-sdk`.

**Package canonico** (`package.ts`): `exportProfilePackage(draft, author)` costruisce
un `DeviceProfilePackage` con `opcodeDependencies` calcolati dagli op reali del draft
(mai dichiarati a mano, quindi non possono disallinearsi dal contenuto). `hash` è
un'impronta di contenuto locale (`contentHash` di `domain`, FNV-1a su JSON canonico) —
esplicitamente **non** lo SHA-256 firmware sui byte CBOR installati
(`DeviceProfileSummary.hash` sul wire): produrlo richiede l'encoder CBOR che costruirà
S063. `importProfilePackageJson()` rispecchia esattamente il sandboxing di
`previewProjectImport` in `domain` (limite byte prima del parse, mai esecuzione del
contenuto, ricalcolo dell'hash e rifiuto in caso di mismatch — questo è quanto verifica
concretamente "revisione/hash del pacchetto impediscono cambiamenti silenziosi").

**Resolver** (`resolver.ts`): `resolveProfileInstall()` copre i sei esiti richiesti
(`READY`/`PROFILE_INSTALL_REQUIRED`/`FIRMWARE_UPDATE_REQUIRED`/`HARDWARE_INCOMPATIBLE`/
`RESOURCE_INCOMPATIBLE`/`VERSION_CONFLICT`) con un ordine di priorità fisso, da soli
dati locali: opcode mancanti (contro il vocabolario noto, di default quello di
`device-profile-authoring-model` stesso — corretto finché esiste solo la versione 1
degli opcode) → capability hardware mancante (bitmask contro `availableCapabilities`
fornito dal chiamante) → stesso id+version già installato (`READY`/`VERSION_CONFLICT`
decisi da un predicato `matchesInstalled` fornito dal chiamante, dato che questo
pacchetto non può calcolare lo SHA-256 reale per confrontarlo — omettere il predicato
fa risolvere sempre a `VERSION_CONFLICT`, mai un `READY` indovinato) → capacità risorse
(`GET_RESOURCES.profiles` pool) → altrimenti `PROFILE_INSTALL_REQUIRED`.

**Test**: 15 nuovi test in 2 file, coprono direttamente ogni bullet delle Verifiche
(round-trip hash su export/reimport, opcode dipendenza non installata →
`FIRMWARE_UPDATE_REQUIRED` invece di un falso `READY`, tampering rilevato). CI completa
verde via Docker.

**Scope onestamente incompleto** (dettagliato nel README del pacchetto): nessuno SHA-256
firmware reale calcolabile qui; nessun indice opcode→Capability Pack esiste sul wire
(`suggestedCapabilityPacks` vale solo quanto il mapping fornito dal chiamante); questo
pacchetto non produce mai i byte CBOR reali che `INSTALL_DEVICE_PROFILE` si aspetta —
quell'encoder e l'integrazione wire install/catalogo restano S063.

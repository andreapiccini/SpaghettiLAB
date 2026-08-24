# S104 — Marketplace: tipi di artifact estendibili e Device Profile

**Stato:** ✅ DONE
**Dipende da:** S063, S101

## Obiettivo

Il marketplace V1 (S101) elenca solo Capability Pack firmware (`providedTypes`:
Block / Rule / Module Driver) e assume installazione = OTA firmata. I Device
Profile sono dati (`INSTALL_DEVICE_PROFILE`, niente flash) e oggi si scambiano
solo come JSON di progetto.

Questo task rende l'indice **discriminato per kind**: un Device Profile è un
artifact di prima classe; aggiungere in futuro un altro tipo scaricabile non
richiede di riscrivere resolver, preflight o UI.

## Implementazione

- `artifact-kind.ts` (nuovo) — `ArtifactInstallStrategy` (`ota-signed-image` |
  `install-device-profile` | `project-import`), `ArtifactKindDescriptor`
  (`id`/`label`/`installStrategy`/`requiresOtaPreflight`), i due descrittori
  reali `FIRMWARE_CAPABILITY_PACK_KIND`/`DEVICE_PROFILE_KIND`, e
  `DEFAULT_ARTIFACT_KINDS: ArtifactKindRegistry` (una `ReadonlyMap`) — un kind
  nuovo si registra qui, mai un `switch` sparso nel resolver.
- `marketplace-catalog.ts` — `parseMarketplaceIndexJson` ora richiede `kind`
  su ogni entry (parametro opzionale `kinds: ArtifactKindRegistry`, default
  `DEFAULT_ARTIFACT_KINDS`, così un caller può registrare un kind proprio
  senza forkare questo pacchetto). Un `kind` mancante resta `INVALID_SHAPE`
  (fatale, come prima); un `kind` presente ma non registrato diventa
  `UNKNOWN_KIND` — raccolto in un nuovo campo `skipped`, **mai fatale**, il
  resto del catalogo resta parsabile. `MarketplaceCatalog` guadagna
  `profiles: readonly DeviceProfilePackage[]` (entry `kind: "device-profile"`,
  validate riusando `@spaghettilab/device-profile-package`'s
  `importProfilePackageJson` — inclusa la sua verifica hash/contenuto, non
  reinventata qui) e `skipped: readonly {target, reason}[]`.
- `required-artifacts.ts` — `RequiredArtifactKind` estesa con `"device-profile"`
  (`typeId` = `profileId@version`, mai un `profileId` nudo: un Module non fissa
  mai una versione, ma `ProjectV1.deviceProfilePackages` sì, e due versioni
  dello stesso profilo non sono intercambiabili ai fini install-readiness).
  `computeRequiredArtifacts` guadagna un 4° parametro opzionale
  `installedDeviceProfileIds` — a differenza di block/rule, questo è
  genuinamente riscontrabile sul wire (`LIST_DEVICE_PROFILES`), non una
  congettura conservativa.
- `profile-resolver.ts` (nuovo) — `resolveProfileRequirement(profileId,
  catalog, context, options)`: trova il profilo (versione più alta,
  deterministico, stesso ordine di `dependency-resolver.ts`), verifica trust
  (`trust.ts`'s `checkPackTrust`, ora generico — vedi sotto — così un profilo
  non trusted non arriva mai a `resolveProfileInstall`), poi delega
  interamente a `@spaghettilab/device-profile-package`'s
  `resolveProfileInstall()` (S062) per il verdetto reale — **mai** un
  secondo resolver che potrebbe disaccordarsi con Device Profile Studio.
  `RESOLVED`'s `install` può essere `FIRMWARE_UPDATE_REQUIRED`: il profilo è
  stato trovato, ma il vocabolario opcode del Core non lo copre — mai
  un'OTA armata da questa funzione, la dipendenza resta dati per il
  chiamante.
- `trust.ts` — `TrustVerifier`/`checkPackTrust` resi generici (default
  `MarketplacePackManifest`, **zero cambi** per ogni chiamante esistente) così
  `profile-resolver.ts` riusa esattamente lo stesso gancio invece di un
  concetto di trust duplicato per il nuovo kind (S104 punto 5).
- `capability-marketplace` guadagna una dipendenza reale su
  `@spaghettilab/device-profile-package` (e, solo nei test,
  `@spaghettilab/device-profile-authoring-model`) — nessun ciclo di
  pacchetti (verificato: `device-profile-package` non dipende a ritroso su
  `capability-marketplace`).
- `MarketplaceTab.tsx` (UI-S100) — un solo punto di aggiornamento minimo:
  lo stato locale `catalog` era tipizzato con un literal inline che non
  includeva i nuovi campi; ora importa e usa `MarketplaceCatalog` reale.
  Nessun'altra modifica alla UI — l'`ArtifactKindId`/`artifact-kind.ts`
  locale di UI-S100 resta il proprio placeholder separato (vedi gap sotto).

## Gap dichiarati

- **UI-S100 non è stata ricollegata al registro reale.** `MarketplaceTab.tsx`
  usa ancora il proprio `artifact-kind.ts` locale (due kind hardcoded,
  scritto prima che questo task esistesse) invece di importare
  `DEFAULT_ARTIFACT_KINDS`/`ArtifactKindDescriptor` da
  `@spaghettilab/capability-marketplace`, e il tab "Disponibili" non mostra
  ancora i profili dal `profiles` del catalogo (solo i pack). Aggiornare la
  UI per consumare il registro reale è un follow-up naturale ma distinto da
  questo task (che è backend, `react-flow-v1`).
- **`ProvidedTypes.profileIds`** menzionato al punto 3 dell'obiettivo
  originale non è stato aggiunto a `MarketplacePackManifest`/un tipo
  parallelo per i profili — `profiles` è già un array a parte con
  `profileId`/`version` propri, quindi un campo `providedTypes.profileIds`
  duplicherebbe la stessa informazione già presente e strutturalmente
  distinta; non implementato perché ridondante, non perché dimenticato.
- **`capabilityPackForOpcode`** (mappatura opcode→pack per
  `FIRMWARE_UPDATE_REQUIRED`) resta interamente caller-supplied, come già in
  S062 — nessun indice opcode→pack esiste sul wire o in
  `MarketplacePackManifest.providedTypes` (confermato, non solo non
  costruito): `resolveProfileRequirement` la passa attraverso, non la
  inventa.

## Verifiche

- un indice misto (pack Kalman + profilo `ina219-raw`) elenca entrambi in
  liste separate; `resolveProfileRequirement` sul profilo non arma OTA —
  verificato (`marketplace-catalog.test.ts`, `profile-resolver.test.ts`);
- un profilo i cui opcode non sono nel vocabolario del Core →
  `FIRMWARE_UPDATE_REQUIRED` con `missingOpcodes` popolato, zero byte flash —
  verificato;
- una entry `kind: "dashboard-widget"` non registrata viene saltata con
  `UNKNOWN_KIND` in `skipped`, il resto del catalogo resta usabile —
  verificato;
- `computeRequiredArtifacts` segnala un `profileId@version` non presente
  nell'insieme installato fornito dal chiamante — verificato;
- un profilo non trusted (o senza verifier) non risolve mai a `RESOLVED` —
  verificato, stesso pattern del pack firmware non trusted.

`docker compose run --rm micro-flow-editor npm run typecheck` — verde.
`vitest run` in `capability-marketplace` (33/33), `ota-preflight` (25/25,
altro consumer del pacchetto) e `security-recovery` (33/33, contiene un
threat test che costruisce `MarketplaceCatalog` letterali, aggiornato per i
nuovi campi) — tutti verdi. Build `app` verde.

## Fine task

- [x] Registro `ArtifactKind` + skip `UNKNOWN_KIND`.
- [x] Kind `device-profile` installabile via S063 (resolver), mai via OTA.
- [x] Required artifacts coprono i profili del Project.
- [x] Resolver profili riusa gli esiti S062; dipendenza opcode → pack è
      dichiarata (caller-supplied, mai inventata).

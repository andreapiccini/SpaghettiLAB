# S104 — Marketplace: tipi di artifact estendibili e Device Profile

**Stato:** ⬜ TODO
**Dipende da:** S063, S101

## Obiettivo

Il marketplace V1 (S101) elenca solo Capability Pack firmware (`providedTypes`:
Block / Rule / Module Driver) e assume installazione = OTA firmata. I Device
Profile sono dati (`INSTALL_DEVICE_PROFILE`, niente flash) e oggi si scambiano
solo come JSON di progetto.

Questo task rende l'indice **discriminato per kind**: un Device Profile è un
artifact di prima classe; aggiungere in futuro un altro tipo scaricabile non
richiede di riscrivere resolver, preflight o UI.

## Implementazione richiesta

1. Introduci un registro di `ArtifactKind` in
   `@spaghettilab/capability-marketplace` (nome del pacchetto può restare: il
   catalogo è del marketplace, non solo dei pack firmware). Ogni kind dichiara:
   - `id` stabile (`firmware-capability-pack`, `device-profile`, …);
   - `installStrategy` (`ota-signed-image` | `install-device-profile` |
     `project-import`);
   - se richiede preflight OTA (S102) — **false** per i profili;
   - come contribuisce a `providedTypes` / required artifacts.
2. Estendi l'indice JSON con `kind` obbligatorio su ogni entry. Un kind
   **sconosciuto** si salta con motivazione `UNKNOWN_KIND`; non fa fallire
   l'intero catalogo e non viene installato. Aggiungere un kind = registrare un
   descrittore, senza `switch` sparsi nel resolver.
3. Kind `device-profile`: artifact = `DeviceProfilePackage` già definito da
   `@spaghettilab/device-profile-package` (hash contenuto, `opcodeDependencies`,
   niente codice eseguibile). Install = flusso S063
   (`VALIDATE_DEVICE_PROFILE` → `INSTALL_DEVICE_PROFILE`). `providedTypes`
   include `profileIds`. Required artifacts del Project includono i
   `profileId@version` usati da Module `declarative-device` e da
   `ProjectV1.deviceProfilePackages`.
4. Il resolver S101 resta valido per i pack firmware. Per i profili riusa gli
   esiti S062 (`READY` / `PROFILE_INSTALL_REQUIRED` / `FIRMWARE_UPDATE_REQUIRED`
   / …): un profilo i cui opcode non sono nel Core non parte un OTA da solo —
   mostra `FIRMWARE_UPDATE_REQUIRED` e, se esiste, il pack firmware che fornisce
   quegli opcode (dipendenza dichiarata, non implicita).
5. Trust: stesso gancio `TrustVerifier` di S101. Un profilo non trusted non si
   installa sul Core. Import oversized resta il cap già in
   `device-profile-package`.

Non fondere un profilo in un'immagine MCUboot. Non far scattare S102/S103 per
`install-device-profile`.

## Verifiche

- un indice misto (pack Kalman + profilo `ina219-raw`) elenca entrambi; Installa
  sul profilo non arma OTA;
- un profilo con opcode 1-Wire assente sul Core → `FIRMWARE_UPDATE_REQUIRED` con
  motivazione, zero byte flash;
- una entry `kind: "dashboard-widget"` non registrata viene saltata con
  `UNKNOWN_KIND`, il resto del catalogo resta usabile;
- `computeRequiredArtifacts` segnala un `profileId` usato in Physical
  Composition e assente sul Core.

## Fine task

- [ ] Registro `ArtifactKind` + skip `UNKNOWN_KIND`.
- [ ] Kind `device-profile` installabile via S063, mai via OTA.
- [ ] Required artifacts coprono i profili del Project.
- [ ] Resolver profili riusa gli esiti S062; dipendenza opcode → pack è
      dichiarata.

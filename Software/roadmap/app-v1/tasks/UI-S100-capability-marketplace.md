# UI-S100 — Capability Marketplace & OTA

[← Roadmap](../README.md) · [UX-S100](../../ux-v1/tasks/UX-S100-capability-marketplace.md) ·
[visual.md](../../../ux/screens/S100-capability-marketplace/visual.md) ·
[ui-behavior.md](../../../ux/screens/S100-capability-marketplace/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S100-capability-marketplace/backend-behavior.md)

**Stato:** ⬜ TODO

Schermata per sfogliare artifact scaricabili, risolvere dipendenze e seguire un
OTA **solo** quando l'`ArtifactKind` lo richiede. Pacchetti:
`capability-marketplace` (S101 + **S104**), `ota-preflight` (S102),
`ota-lifecycle` (S103), `device-profile-install` (S063).

## Cosa deve coprire oltre UX-S100 originale

UX-S100 è stata scritta quando il marketplace era solo Capability Pack. S104
aggiunge i Device Profile come kind distinto. La UI deve:

1. Derivare i chip filtro (Driver, Block, Profile, …) dal registro kind, non da
   una lista hardcoded. Un kind nuovo compare senza un deploy UI dedicato, se il
   descrittore porta `label`/`icon`.
2. Tenere Disponibili / Installati / Richiesti distinti **anche per kind**: un
   profilo installato sul Core (`LIST_DEVICE_PROFILES`) non va nella lista pack
   `GET_FEATURES`.
3. Pulsante primario: se `installStrategy === install-device-profile` → flusso
   S063 (validate/install dati, resto in Device Profile Studio se serve);
   se `ota-signed-image` → tab Preflight (S102) poi Aggiornamento (S103).
   Un profilo **non** apre lo stepper OTA.
4. Card profilo: mostra transport (I2C/SPI/UART/GPIO/ADC/W1) e
   `opcodeDependencies`; esito resolver S062 visibile come in UX-S060.

## Fine task

- [ ] Schermata raggiungibile, tre tab, tre liste non fuse.
- [ ] Filtri e Installa guidati da `ArtifactKind` (S104), non da if su
      "pack vs profilo" sparsi nei componenti.
- [ ] Install profilo = S063; OTA = S102/S103; kind sconosciuto non cliccabile,
      con motivazione.
- [ ] CI verde; verifica visiva contro `visual.md`.

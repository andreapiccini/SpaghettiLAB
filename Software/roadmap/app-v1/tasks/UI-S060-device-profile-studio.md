# UI-S060 — Device Profile Studio

[← Roadmap](../README.md) · [UX-S060](../../ux-v1/tasks/UX-S060-device-profile-studio.md) ·
[visual.md](../../../ux/screens/S060-device-profile-studio/visual.md) ·
[ui-behavior.md](../../../ux/screens/S060-device-profile-studio/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S060-device-profile-studio/backend-behavior.md)

**Stato: ✅ DONE**

Editor sequenziale (mai un canvas — vedi la motivazione nello stesso `visual.md`)
per autorare un Device Profile: metadata, transport/capability, sei sezioni di
step fisse, campi output, pannello Compatibilità con i sei esiti del resolver.
Cablato su `@spaghettilab/device-profile-authoring-model`/`-package`/`-install`
(S061-S063, reali, contrariamente alla nota "⬜ TODO" nel `backend-behavior.md`
di questa schermata, scritta prima che il backend fosse costruito).

## Implementazione

- `instruction-config.ts` — tabella dei 21 opcode reali
  (`@spaghettilab/device-profile-authoring-model`'s `Instruction`), raggruppati
  nelle 10 categorie del selettore di `visual.md`, con descrittori di campo per
  form generico (niente 21 componenti bespoke) e fabbrica di istanza di default.
- `StepRow.tsx`/`InstructionSection.tsx` — riga step (numero, chip tipo,
  riepilogo inline, modifica/elimina) e sezione accordion; riordino via
  pulsanti su/giù (non drag reale — vedi gap) invece del drag-to-reorder di
  `ui-behavior.md`.
- `MetadataTab.tsx`/`TransportTab.tsx`/`OutputTab.tsx`/`InstructionsTab.tsx` —
  le quattro tab di editing.
- `CompatibilityPanel.tsx` — le sei card esito (`InstallResolution`, reale),
  dettaglio budget (`computeBudget()` reale vs i limiti `max*` dichiarati dal
  profilo stesso).
- `ImportExportDialog.tsx` — anteprima obbligatoria prima di importare/scaricare
  (`exportProfilePackageJson`/`importProfilePackageJson`, reali, mai
  un'importazione silenziosa né un'esecuzione del contenuto).
- `DeviceProfileStudioScreen.tsx` — tab, salvataggio (`ProjectV1.deviceProfilePackages`,
  nuovo — vedi sotto), installazione (`CoreSession.installProfile()`, nuovo),
  instanziazione come Module (`instantiateModuleFromProfile()` reale + navigazione
  a Physical Composition, mai un form duplicato qui).
- `core-session`: aggiunti `CoreSession.installProfile()`/`.removeProfile()`
  (stesso pattern di `listDeviceProfiles()`/`listDiscoveryCandidates()` da
  UI-S040/UI-S050) — richiede una nuova dipendenza reale di questo pacchetto da
  `@spaghettilab/device-profile-authoring-model`/`-install`.
- `domain`: aggiunto `ProjectV1.deviceProfilePackages: readonly string[]`
  (stringhe JSON canoniche, opache per `domain` — non dipende da
  `@spaghettilab/device-profile-package`, stesso principio già usato per
  `GraphState.data`) + comando `setDeviceProfilePackages()`. Retrocompatibile:
  `validateProjectV1` non rifiuta un progetto già salvato senza questo campo,
  lo inizializza a `[]`.
- `LeftRail.tsx`: icona corretta da `FileCode` a `Cpu` (bug reale, vedi sotto).

## Bug reali risolti mentre si cablava questa schermata

1. **Icona sbagliata nel left rail.** `visual.md` specifica `Cpu` per "Device
   Profile Studio"; `LeftRail.tsx` (da UI-S010) usava `FileCode`, mai
   verificato contro questo file finché non l'ho letto per questo task.
2. **Dropdown "+ Aggiungi step" tagliata dal contenitore dell'accordion.**
   `overflow-hidden` sul `motion.div` dell'animazione di espansione sezione
   (necessario per l'altezza `0→auto`) tagliava anche il menu a tendina
   assoluto nidificato dentro, una volta più alto del contenuto circostante —
   trovato dal vivo aprendo "Aggiungi step" e vedendo il menu troncato dopo
   una sola riga. Corretto passando a `overflow-visible` dopo che l'animazione
   di apertura è completata (`onAnimationComplete`), tornando a
   `overflow-hidden` ad ogni nuova apertura (il componente si smonta quando la
   sezione si chiude, quindi lo stato si azzera da solo).

## Gap onesti (non risolti in questo task)

- **`DeviceProfileDraft` non ha campi `name`/`author`/`description`** — rispecchia
  esattamente `struct spaghetti_device_profile`, che non li ha. "Nome" è
  persistito via `AuthoringMetadata.comment` (stesso pattern già usato per i
  nodi di Physical Composition, chiave `profile:<id>@<versione>`); "Autore" è
  reale (diventa `DeviceProfilePackage.author`); "Descrizione" **non è
  persistita da nessuna parte** — resta stato locale del componente, dichiarato
  esplicitamente in UI, non inventato come campo di dominio.
- **Nessun vincolo elettrico da Bay** — `RailEntry`/`FunctionBayEntry`
  (`catalog-model`) non hanno tensione/modalità/frequenza massima, solo
  `assurance`/`admission`/`maxTotalMicroamps` grezzi (stesso gap già
  documentato per UI-S040/UI-S050). Il banner mostra sempre lo stato onesto
  "nessun vincolo disponibile", mai un valore fabbricato.
- **Riordino step via pulsanti su/giù, non drag reale** — semplificazione di
  interazione dichiarata (non un gap di dati): costruire un vero
  drag-and-drop per liste con animazione spring avrebbe richiesto molto più
  codice per un guadagno di fedeltà marginale in questo primo passaggio.
- **Nessuna libreria/elenco dei profili già salvati nel progetto** — l'editor
  gestisce una sola bozza alla volta; "Salva profilo" scrive/aggiorna
  `ProjectV1.deviceProfilePackages` per chiave `id@versione`, ma non c'è
  ancora un modo di **ricaricare** un profilo salvato in precedenza tornando
  sulla schermata (va reimportato dal JSON esportato). Gap reale, non
  bloccante per il flusso autore→salva→esporta→installa.
- **"Elimina profilo"** (`backend-behavior.md` punto 4, `CoreSession.removeProfile()`
  già cablato lato backend) non ha un'azione nella UI in questo passaggio —
  il metodo esiste ed è testato, ma nessun pulsante lo richiama ancora.
- **Pulsanti "Cambia Bay"/"Vedi requisiti firmware"/"Aggiorna pacchetto"**
  (per gli esiti `HARDWARE_INCOMPATIBLE`/`FIRMWARE_UPDATE_REQUIRED`/
  `VERSION_CONFLICT`) non navigano da nessuna parte di specifico — non esiste
  ancora una superficie reale per "vedi requisiti firmware" o "aggiorna
  pacchetto" in nessun'altra schermata. Solo `FIRMWARE_UPDATE_REQUIRED` mostra
  qualcosa di azionabile (l'elenco reale degli opcode mancanti).
- **`availableCapabilities` non passato al resolver** — lo stesso gap del
  vincolo elettrico da Bay: senza un modo reale di risolvere la bitmask
  capability della Bay target, il controllo hardware-compatibility del
  resolver è saltato (mai un valore inventato), quindi l'esito
  `HARDWARE_INCOMPATIBLE` non si presenterà mai con i dati attuali.
- **Verificato dal vivo solo senza un Core reale raggiungibile** — creazione
  profilo, step I2C real-shaped, campi output, calcolo budget reale, anteprima
  export reale, salvataggio esplicito (`⌘S`) con verifica diretta in
  `localStorage`. Non verificato dal vivo: `installProfile`/`removeProfile`
  contro un Core reale (coperti da test unitari con protocollo reale simulato
  in `core-session`), e "Instanzia come Module" end-to-end (richiede un
  Core `READY` con un profilo installato corrispondente).

## Verifica

- `docker compose run --rm micro-flow-editor npm run ci` — verde (typecheck,
  lint 0 errori/5 warning pre-esistenti, test — inclusi i nuovi test di
  `CoreSession.installProfile()`/`.removeProfile()` in `core-session` — e
  build).
- Verificato dal vivo nel browser: creazione di un profilo (Nome/ID/Versione),
  aggiunta di uno step "I2C read" reale con campi corretti (dst/length/timeout),
  dettaglio budget con valori calcolati reali (20ms/1 transazione/1 byte/1
  operazione) contro i limiti dichiarati, anteprima "Esporta" con hash/opcode
  dipendenze reali, `⌘S` → verifica diretta in `localStorage` che
  `deviceProfilePackages` contenga la voce salvata, reload completo della
  pagina con il progetto ancora presente.

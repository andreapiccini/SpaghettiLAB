# UI-S120 — Settings, Security & Recovery

[← Roadmap](../README.md) · [UX-S120](../ux-v1/tasks/UX-S120-settings-security.md) ·
[visual.md](../../ux/screens/S120-settings-security/visual.md) ·
[ui-behavior.md](../../ux/screens/S120-settings-security/ui-behavior.md) ·
[backend-behavior.md](../../ux/screens/S120-settings-security/backend-behavior.md)

**Stato: ✅ DONE**

Sette tab (Interfaccia/Credenziali/Backup & Versioni/Import-Export sempre visibili;
Permessi/Audit/Recovery solo in modalità avanzata, S125) cablati su
`domain/permission.ts` (S121), `project-store`'s `ProjectAutosaveStore` (S122),
`domain/project-import-export.ts` (S123) e `@spaghettilab/security-recovery`
(S124) — tutti reali, contrariamente alla nota "⬜ TODO" stantia del
`backend-behavior.md` di questa schermata (S121-S124 sono tutti ✅ DONE nel
roadmap backend, stesso pattern visto per ogni screen precedente tranne S104).

## Implementazione

- `SettingsSecurityScreen.tsx` — 7 tab, filtro base/avanzata riusando
  `useUiMode()` (S125, già cablato al command palette, ora esposto anche come
  impostazione persistente in `InterfaceTab.tsx`).
- `CredentialsTab.tsx` — lista `ConnectionProfile` con `credentialRef`
  (`listConnectionProfiles()`, nuova funzione aggiunta a
  `connection-profile-store.ts`, esistente già solo per get/save singoli),
  rimozione via `confirmCredentialRemoval()` reale (S124) + `ConfirmDialog.tsx`
  (stesso pattern "ridigita il target" di Runtime & Diagnostics).
- `PermissionsTab.tsx` — matrice dei 13 `PERMISSION_SCOPES` reali (S121),
  raggruppati per prefisso (Core/Node-RED/Progetto), riusa
  `PLACEHOLDER_GRANTED_ALL` già introdotto per Runtime & Diagnostics invece
  di duplicarne un secondo.
- `BackupVersionsTab.tsx` — prima istanziazione in tutta l'app di
  `ProjectAutosaveStore` (S122, pacchetto costruito ma mai usato prima
  d'ora — vedi `repository.ts`): "Salva ora" reale, cronologia versioni
  reale, verificato dal vivo (rev 0 creata con timestamp reale).
- `ImportExportTab.tsx` — `previewProjectImport()`/`resolveProjectImportId()`/
  `exportProjectSelective()` reali (S123): anteprima obbligatoria prima di
  importare, gestione ID duplicato, badge chiavi sospette, download reale
  dell'export.
- `AuditTab.tsx` — `LocalStorageAuditLog` (nuovo adattatore reale del port
  `AuditLog`, scritto per questo task — prima esisteva solo `InMemoryAuditLog`,
  un fake di test), tabella filtrable per operazione.
- `RecoveryTab.tsx` — 6 card fisse, ciascuna apre uno stepper con il piano
  reale da `@spaghettilab/security-recovery` (S124): `coreReplacedRecoveryPlan`,
  `deviceIdMismatchRecoveryPlan`, `configCorruptOrAbsentRecoveryPlan`,
  `catalogIncompatibleRecoveryPlan`, `otaRollbackRecoveryPlan`,
  `nodeRedUnreachableRecoveryPlan` — badge "distruttivo" per gli step che lo
  sono, verificato dal vivo.
- `browser-clock.ts` — `BrowserClock implements Clock`, mancava (serviva per
  istanziare `ProjectAutosaveStore`).
- `connection-profile-store.ts` — aggiunte `listConnectionProfiles()` e
  `removeConnectionProfile()` (prima esistevano solo `get`/`save` singoli).
- `repository.ts` — aggiunto `projectAutosaveStore` (istanza condivisa).

## Gap dichiarati

- **Nessuna schermata scrive mai un `credentialRef` su un `ConnectionProfile`.**
  `ConnectCoreDialog.tsx` non ha alcun campo credenziali — il tab Credenziali è
  quindi onestamente vuoto finché quel flusso di autoria non esiste altrove.
- **Nessun adattatore `CredentialStore` persistente esiste per il browser** —
  `localStorage` in chiaro non è un posto sicuro per un segreto, quindi non ne
  è stato costruito uno qui. Il tab Credenziali usa `InMemoryCredentialStore`,
  dichiaratamente non persistente (perso al reload), non un fake spacciato
  per reale.
- **`ProjectAutosaveStore` è un percorso di salvataggio separato** da quello
  del Command Palette ("Salva progetto", `projectRepository`, un layout di
  chiavi diverso: `project:<id>` vs `project:<id>:rev:<n>`/`project:<id>:meta`).
  La cronologia versioni del tab Backup & Versioni riflette solo i salvataggi
  fatti da quel tab, non da Cmd+S. Unificare i due percorsi è un cambio
  cross-cutting reale ma fuori scopo per questo task.
- **"Ripristina" nella cronologia versioni è disabilitato.**
  `ProjectAutosaveStore` espone solo `load()` (sempre la revisione più
  recente), `save()` e `history()` — nessun metodo pubblico legge il
  contenuto di una revisione storica specifica. Il pulsante lo dichiara
  esplicitamente via `title`, invece di fingere che funzioni.
- **`includeImages`/`includeLiveRecords` nell'export sono strutturalmente
  inerti** — `ProjectV1` non ha ancora campi immagine/record live (nessuno
  screen li scrive), come documentato dal pacchetto `project-import-export.ts`
  stesso. I checkbox restano nell'interfaccia (per corrispondere a
  `visual.md`) con nota esplicita "inerte oggi" accanto a ciascuno.
- **Il tab Audit è reale ma vuoto per design** — nessuno screen precedente
  di questa app chiama ancora `recordSensitiveOperation()` per le proprie
  azioni reali (connect Core, comando, install profilo, OTA, reset, deploy
  Node-RED). Cablare ciascun punto di chiamata è un cambio cross-cutting su
  più screen già costruiti (Runtime & Diagnostics, Device Profile Studio,
  Capability Marketplace, Cross-Core Automation), fuori scopo per questo
  singolo task.
- **Le card Recovery per "Core sostituito"/"Device ID mismatch"/"OTA
  rollback"** accettano parametri (nome binding, device ID atteso/osservato,
  versioni) che una card generica aperta in isolamento non ha — mostrati con
  placeholder `—`. Un flusso reale li popolerebbe da un banner di errore
  specifico aperto da Core Connections/Aggiornamento, non raggiungibile da
  qui.
- **Nessun sistema di permessi/login reale esiste ancora** — stesso gap già
  documentato per Runtime & Diagnostics: `PLACEHOLDER_GRANTED_ALL` concede
  tutti gli scope, in attesa di `ecosystem-access-v1`.

## Verifica

- `docker compose run --rm micro-flow-editor npm run typecheck` — verde.
- `docker compose run --rm micro-flow-editor npm run -w @spaghettilab/app lint` —
  verde per i file di questo task (0 errori); un errore pre-esistente in un
  file di un lavoro concorrente non correlato (`NodeRedRuntimeBar.tsx`) non è
  stato toccato/committato da questo task.
- `docker compose run --rm micro-flow-editor npm run -w @spaghettilab/app build` —
  verde.
- Verificato dal vivo nel browser: tutti e 7 i tab raggiungibili senza
  crash/errori console; "Salva ora" nel tab Backup & Versioni ha
  effettivamente creato una revisione reale (rev 0, timestamp reale) tramite
  `ProjectAutosaveStore`; il tab Permessi mostra i 9 scope Core reali; il tab
  Recovery apre uno stepper con contenuto reale dal pacchetto
  `security-recovery` (badge "distruttivo" corretto sullo step di deploy).

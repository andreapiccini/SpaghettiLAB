# UI-S080 — Deploy & Diff

[← Roadmap](../README.md) · [UX-S080](../../ux-v1/tasks/UX-S080-deploy-diff.md) ·
[visual.md](../../../ux/screens/S080-deploy-diff/visual.md) ·
[ui-behavior.md](../../../ux/screens/S080-deploy-diff/ui-behavior.md) ·
[backend-behavior.md](../../../ux/screens/S080-deploy-diff/backend-behavior.md)

**Stato: ✅ DONE**

Schermata dove il grafo autorato (Physical Composition + Processing Graph) viene
confrontato con lo stato live del Core e applicato in sicurezza, cablata su
`@spaghettilab/config-deployment` (S080, reale, contrariamente alla nota "⬜ TODO"
nel `backend-behavior.md` di questa schermata, scritta prima che il backend fosse
costruito).

## Implementazione

- `ConfigDiffView.tsx` — accordion per tipo entità (Module/Schedule/Rule/Block/Edge),
  righe Aggiunto/Rimosso/Modificato, "Vedi campi" per il dettaglio prima/dopo di una
  riga modificata, riga Policy separata (solo booleano, nessun diff per-campo
  disponibile — vedi gap).
- `PipelineStepper.tsx` — 6 tappe fisse, ma **stato finale mappato dall'outcome**,
  non progresso incrementale reale (vedi gap).
- `DeployDiffScreen.tsx` — header (badge conteggio, "Avvia deploy"), pillole Core
  target (multi-select, solo Core con diff non vuoto **ricalcolato fresco** ad ogni
  render — non riusa `syncRelationship` di S030, che è calcolato una sola volta al
  connect e può diventare stantio dopo che l'utente modifica il grafo), banner
  blocco profili mancanti con link a Device Profile Studio, pannello conflitto
  (`STALE_GENERATION`), report per-Core.
- `core-session`: aggiunto `CoreSession.deployConfig()` (stesso pattern di
  `installProfile()`/`removeProfile()` — `SpaghettiClient` soddisfa strutturalmente
  `ConfigWireClient`).
- `core-sessions-context.tsx`: esposto `deployConfig`.
- `domain/src/commands.ts`: aggiunto `appendDeploymentRecord()` — mancava un comando
  per persistere un `DeploymentRecordV1` dopo un deploy riuscito (il tipo esisteva
  già in `ProjectV1.deploymentRecords`, ma nessun comando lo scriveva).
- `lib/default-config-policy.ts` — estratti `DISABLED_MQTT`/`DEFAULT_ENERGY` (già
  introdotti in UI-S070) in un file condiviso, così Processing Graph Editor e Deploy
  & Diff calcolano esattamente lo stesso Config candidato per lo stesso grafo.

## Bug reale risolto mentre si cablava questa schermata

**Stesso pattern di loop di render infinito già trovato e corretto in UI-S070** —
prevenuto qui fin dall'inizio usando costanti di modulo stabili (`EMPTY_PHYSICAL`,
`EMPTY_PROCESSING`, `EMPTY_BINDINGS`) invece di letterali oggetto/array inline nei
fallback `?? ...`, dopo aver imparato la lezione dal crash di UI-S070. ESLint ha
comunque segnalato la dipendenza instabile di `bindings` in una `useMemo` prima del
commit (non un crash qui, dato che nessun pattern "resync in render" la consumava,
ma comunque una causa reale di ricalcoli sprecati) — corretta con lo stesso
`EMPTY_BINDINGS`.

## Gap onesti (non risolti in questo task)

- **Nessun progresso incrementale reale nello stepper** — `deployConfig()` esegue
  l'intera pipeline (compila → valida locale → risolvi artifact → valida remota →
  applica CAS → verifica read-back) in un'unica chiamata atomica, senza callback
  per singola tappa. Lo stepper mostra lo stato finale mappato dall'esito
  (`DeploymentOutcomeKind`) e, quando ambiguo fra due tappe, dal codice/target del
  primo issue — non un progresso dal vivo. Documentato esplicitamente nella UI
  stessa ("nessun progresso incrementale reale per singola tappa").
- **"Rebase/merge strutturato" non è implementato** — `CoreSession.reconcile()`
  lancia sempre `RECONCILE_NOT_IMPLEMENTED` ("richiede il Config decompiler, non
  ancora cablato qui" — nota ormai imprecisa: S073 esiste, ma nessuno ha ancora
  collegato `reconcile()` ad esso). Il pulsante è disabilitato con un tooltip
  esplicito invece di fingere che funzioni.
- **"Importa stato live" non ancora cablato all'azione reale** — il pulsante esiste
  nel pannello conflitto ma non invoca ancora `CoreSession.importLiveState()` seguito
  da un comando che sostituisce i grafi autorati del Core con quelli decompilati
  (`decompileConfig`) — implementazione rimandata, il pannello mostra comunque il
  diff completo del conflitto.
- **Nessuna riconciliazione reale fra `ProjectV1.requiredArtifacts` e i pacchetti
  installati** — il banner "Deploy bloccato" usa `dryRunConfig`'s
  `availableProfileIds` (popolato da `CoreSession.listDeviceProfiles()`, reale) ma
  non `availableBlockRuleTypeIds` (nessuna funzione mappa un Capability Pack
  installato ai tipi Block/Rule che fornisce — `FeaturePack` non ha un campo per
  questo, stesso gap già documentato per il resolver di Device Profile Studio).
- **Diff mostrato per-Core separatamente quando più Core sono selezionati**, non
  come "unione" come suggerito da `visual.md` — unire chiavi Module/Rule/Block fra
  Core diversi (ciascuno con la propria numerazione di chiavi indipendente) non ha
  un'identità comune sensata; una sezione per Core evita di far apparire due
  elementi indipendenti come se fossero lo stesso elemento "cambiato due volte".
- **Verifica dal vivo limitata dall'assenza di un Core reale raggiungibile** in
  questo ambiente sandboxed (stesso limite di UI-S040/S050/S060/S070): verificato
  lo stato vuoto (nessun Core con modifiche pendenti), nessun crash, console pulita
  su una tab nuova, bottone "Avvia deploy" correttamente disabilitato. La logica di
  diff/pipeline/conflitto è stata verificata per lettura del codice + gli unit test
  già esistenti di `config-deployment` (non riscritti qui) + il nuovo test
  `CoreSession.deployConfig()` (percorso di successo, con hash reale via
  `crypto.subtle.digest`).

## Verifica

- `docker compose run --rm micro-flow-editor npm run ci` — verde (typecheck, lint 0
  errori/6 warning pre-esistenti, test — incluso il nuovo test di
  `CoreSession.deployConfig()` in `core-session` e `appendDeploymentRecord()` in
  `domain` — build).
- Verificato dal vivo nel browser (tab pulita): navigazione dal left rail, stato
  "Nessun Core con modifiche pendenti" senza crash, console senza errori, "Avvia
  deploy" disabilitato correttamente.

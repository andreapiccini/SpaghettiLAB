# Deploy & Diff — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Fonte: S080 (Deploy Config transazionale — Deployment
Coordinator, ⬜ TODO). Questo file descrive cosa dovrebbe partire una volta
implementato, coerente con la convenzione di `roadmap/ux-v1/README.md`.

## Caricamento (mount)

1. Il selettore Core target elenca i Core con `PROJECT_DIRTY` secondo la
   classificazione sync già introdotta in `UX-S030` (S030) — questa schermata non
   ricalcola quella classificazione, la riusa.
2. Per ciascun Core selezionato, il diff mostrato è il **diff semantico** prodotto
   dal Deployment Coordinator di S080 punto 2: confronto fra live, ultimo
   deployato e candidato, per Module/Profile/Schedule/Rule/Block/edge/policy —
   "ignora metadata authoring" (S080 punto 2, garanzia esplicita) è esattamente
   perché posizione/colore/commenti non compaiono mai come riga di diff in
   `visual.md`.

## Avvio deploy

1. "Avvia deploy" istanzia, per ciascun Core selezionato, la pipeline di S080
   punto 1: `compila → valida locale → risolvi artifact → valida remota → applica
   (CAS) → verifica read-back` — ogni tappa dello stepper in `visual.md`
   corrisponde 1:1 a una fase di questa pipeline, mai una barra aggregata
   sintetica.
2. Se un profilo o Capability Pack richiesto non è installato, S080 punto 3
   blocca il deploy per quel Core **prima** di avviare la pipeline, mantenendo
   il candidate immutato, e propone S060/S100 — il banner "Deploy bloccato" in
   `visual.md` riflette esattamente questo blocco, con i link diretti alle due
   schermate citate in S080 punto 3. Il deploy riprende solo dopo un nuovo
   risync (non un semplice "riprova").
3. L'apply (tappa "Applica (CAS)") usa sempre expected generation/hash (S080
   punto 4) — non esiste un percorso che scriva senza CAS, coerente con "Non
   esiste percorso di deploy senza validate e CAS" (S080 § Fine task).

## Conflitto (`CONFLICT`)

1. Su `CONFLICT`, S080 punto 4 legge il nuovo snapshot e offre esattamente le
   tre azioni mostrate nel pannello di `visual.md`: importa stato live,
   rebase/merge strutturato, annulla — "niente force/last-write-wins V1" (S080
   punto 4, garanzia esplicita) è il motivo per cui non esiste un pulsante
   "sovrascrivi" in nessuna forma.
2. "Rebase/merge strutturato" avvia il flusso di riconciliazione strutturata di
   S080 (non un merge testuale) — il risultato produce un nuovo candidate da
   rivalidare, la pipeline riparte dalla tappa "Valida locale".
3. "Annulla" interrompe senza side effect: il progetto resta `dirty` con le
   diagnostiche preservate (S080 punto 7: "Preserva progetto dirty e diagnostics
   su qualsiasi fallimento").

## `DeploymentRecord`

Un `DeploymentRecord` viene scritto **soltanto dopo** il read-back con hash
atteso (S080 punto 5) — un apply no-op viene registrato come tale, "senza
fingere nuova generation" (S080 punto 5). La UI non mostra mai un Core come
"deployato con successo" prima che questo record sia stato scritto — il pallino
di stato pipeline in `visual.md` passa a `color.success` solo dopo che questa
scrittura è confermata, non appena l'apply remoto risponde.

## Disconnessione/timeout durante l'apply

Se la risposta va persa (S080 punto 6), la UI non assume né successo né
fallimento: la tappa "in corso" resta tale (pallino pulsante) finché S080 non
ha interrogato il Config e riconciliato lo stato reale (query + replay state
prima di ritentare) — nessun timeout lato client che marchi autonomamente la
tappa come fallita prima che questa riconciliazione sia completata.

## Deploy multi-Core

1. Ogni Core selezionato è un'esecuzione **indipendente** della pipeline (S080
   punto 8) — "V1 non promette transazione atomica distribuita" (S080 punto 8,
   garanzia esplicita): il report multi-Core in `visual.md` riflette
   letteralmente questa non-atomicità, non è solo una scelta di layout.
2. Un fallimento su un Core non altera lo stato osservato di un altro Core (S080
   § Verifiche: "fallimento su Core B non falsifica lo stato di Core A") — la
   riga di quel Core nel report resta quella del proprio esito reale.

## Reboot durante apply

Un reboot durante l'apply viene riconciliato da boot ID + Config hash (S080 §
Verifiche) — se questo accade, la tappa pipeline coinvolta mostra il messaggio
di dettaglio (`visual.md` § Pipeline) riportato dalla riconciliazione, non un
errore generico "connessione persa".

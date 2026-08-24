# Cross-Core Automation — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Fonti: S111 (System Automation Graph e compatibility engine, ⬜
TODO), S112 (package nodi Node-RED SpaghettiLAB, ⬜ TODO), S113 (compiler, Admin API
deploy e diagnostica runtime, ⬜ TODO) — nessuna ancora implementata; questo file
descrive cosa dovrebbe partire una volta che lo sono, coerente con la convenzione di
`roadmap/ux-v1/README.md`.

## Tab Grafo

1. Gli endpoint `Core record field`/`Core command` mostrati sul canvas
   referenziano sempre **device ID + stable key + schema/field/command, mai
   runtime ID** (S111 punto 1, garanzia esplicita) — un nodo sul canvas non
   perde identità se il Core si disconnette/riconnette con una nuova sessione,
   coerente con S111 § Verifiche: "un endpoint del grafo referenzia sempre
   device ID + stable key, mai un ID di sessione effimero".
2. Il catalogo unificato dei Core disponibili (per popolare la palette/ricerca
   endpoint, non descritta a parte in `visual.md` ma implicita nell'aggiunta di
   un nodo) viene dal compatibility engine di S111 punto 2.
3. Il chip trasformazione compare solo quando il compatibility engine rileva
   unità/tipi differenti fra due endpoint (S111 punto 2: "un link
   temperatura→display deve dichiarare trasformazione quando gli schemi
   differiscono") — le opzioni offerte nel popover sono quelle che il
   compatibility engine considera valide per quella coppia di schemi, mai una
   formula libera scritta dall'utente (coerente con "senza formule JavaScript
   arbitrarie" già visto in S061).
4. Un link fra schemi con unità incompatibili "non converte implicitamente"
   (S111 § Verifiche) — è il motivo per cui l'edge resta visivamente incompleto
   (tratteggiato rosso) finché la trasformazione non è scelta esplicitamente.
5. Il "Rivalida" di un link stale invoca la rivalidazione di S111 § Verifiche
   ("un catalog change su un Core coinvolto rende stale i link finché non
   vengono rivalidati") — non c'è auto-rivalidazione silenziosa al solo
   reconnect del Core.

## Nodi Node-RED reali (S112, riferimento indiretto)

I tre tipi di nodo canvas (record field/command/processing) corrispondono ai
nodi Node-RED reali del package di S112 (connection/config, record source,
command target, status, coordinator) — "riusa lo stesso SDK Protocol usato dal
resto dell'applicazione" (S112 punto 1): questa schermata non genera una
codifica Protocol propria, il canvas è solo la rappresentazione autore di ciò
che quei nodi eseguiranno realmente dopo il deploy.

## Tab Deploy Node-RED

1. Il banner di scope e il diff riflettono il compiler di S113 punto 1: "compila
   il System Automation Graph in flow Node-RED deterministico con owner/project
   metadata e stable node IDs" — ogni riga diff mostra `owner: {progetto}`
   perché è letteralmente il metadata che il compiler assegna, non un'etichetta
   decorativa della UI.
2. "Credenziali sono riferite, non esportate" (S113 punto 1, garanzia esplicita)
   — nessun campo del diff o del deploy mostra mai un valore di credenziale, in
   coerenza con la stessa regola già stabilita per il credential store in
   `UX-S120`.
3. Il deploy vero e proprio usa l'adapter Node-RED Admin API di S113 punto 2
   (get revision, validate, diff, deploy) — "riconcilia soltanto tab/subflow/
   nodi posseduti dal progetto e conserva flow utente estranei" (S113 punto 2,
   garanzia esplicita) è esattamente il contenuto del banner di scope in
   `visual.md`.
4. Il badge `IN_SYNC`/`DIVERGED` viene dalla classificazione di S113 punto 4
   ("classifica IN_SYNC/DIVERGED come per Config") — riusa concettualmente la
   stessa logica già mostrata per i Core in `UX-S030`, applicata qui allo stato
   gestito Node-RED. "Niente deploy automatico al reconnect" (S113 punto 4,
   garanzia esplicita) è il motivo per cui `DIVERGED` apre sempre le tre azioni
   esplicite, mai un auto-merge.
5. Una revisione concorrente (altro client ha modificato Node-RED nel
   frattempo) produce conflict e "non sovrascrive silenziosamente" (S113 §
   Verifiche) — riflesso dallo stesso pannello `DIVERGED`, non un errore
   generico.

## Tab Diagnostica

1. Il breadcrumb end-to-end (record source → Node-RED → command target) è
   esattamente la diagnostica di S113 punto 5 ("runtime status del
   collegamento end-to-end e diagnostica dal record source al command
   target").
2. Una tappa offline (broker, Node-RED o Core) **non ferma i runtime locali
   degli altri componenti** (S113 § Verifiche, garanzia esplicita) — è il
   motivo strutturale, non solo visivo, per cui in `visual.md` una tappa
   offline si dim­mera senza alterare le altre tappe/catene.
3. "Un record duplicato/retry non duplica il comando corrispondente" (S113 §
   Verifiche) — la gestione di backpressure/retry di S113 punto 3 garantisce
   questo a livello di dominio; il log eventi in `visual.md` mostra quindi al
   più un singolo esito per comando, mai righe duplicate per un retry interno.
4. L'import dello stato gestito Node-RED (S113 punto 4) è disponibile da questa
   tab quando applicabile, con la stessa classificazione sync di cui sopra —
   non descritto come azione separata in `visual.md` perché confluisce nello
   stesso flusso `DIVERGED` della tab Deploy.

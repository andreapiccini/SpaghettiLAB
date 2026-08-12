# Physical Composition Editor — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Fonte: S050 (Composizione fisica e configurazione Module, ⬜ TODO
— questo file descrive cosa dovrebbe partire una volta implementato, coerente con la
convenzione di `roadmap/ux-v1/README.md`). Riferimenti aggiuntivi: `EditorModel`
(S042, già usato per il form del Processing Graph Editor), `CommandStack` (S014).

## Caricamento (mount)

1. Backbone, Power, Function Bay, Connector disponibili nel canvas vengono
   costruiti **soltanto** dalle Flow/Bay/rail dichiarate dal Core (S050 punto 2)
   — mai da un'assunzione elettrica precompilata nell'app, coerente con la stessa
   regola già applicata alla Topologia in `UX-S040`.
2. Le entità già posizionate/collegate nel progetto sono authoring entity
   persistite (S050 punto 1: "associa label e grouping senza alterare identità
   firmware") — la posizione sul canvas è metadata locale, non tocca l'identità
   Module (coerente con S014 § authoring metadata già usato in S070).

## Aggiungere/configurare un Module

1. "+ Aggiungi Module" apre il form vuoto nell'Inspector; nessun comando di
   dominio parte finché il form non viene salvato con almeno indirizzo e
   Port/Bay validi (S050 punto 3: "Configura Module key stabile, driver/profile,
   Port, Bay, power rail, endpoint, indirizzo, chip-select, modalità elettrica e
   proprietà schema-driven").
2. Salvataggio → comando di dominio via `CommandStack` (S014) che crea/aggiorna
   il Module nel Physical Composition Graph — la stessa `CommandStack` che
   alimenta undo/redo nella top bar (`UX-S010`).
3. Più Module sulla stessa Port sono permessi quando endpoint/transport lo
   consentono (S050 punto 4) — il form non blocca questo caso, blocca solo la
   collisione reale (vedi sotto).

## Rilevamento collisione indirizzi

1. Ad ogni modifica di indirizzo/Port che coinvolge più di un Module, S050
   verifica la collisione **prima del deploy** (S050 § Verifiche: "collisione
   endpoint, Bay inesistente, rail incompatibile e transport errato falliscono") —
   il banner e il badge riga in `visual.md` riflettono questo controllo, non una
   verifica lato client isolata: dipende dallo stato di tutti gli altri Module
   già configurati nella stessa composizione.
2. Il badge collisioni nell'header aggrega il conteggio di tutte le collisioni
   attive nel progetto, aggiornato ad ogni comando che tocca un Module.

## Power `ENFORCED`/`UNVERIFIED`

Stesso principio già stabilito in `UX-S040` per la topologia: il valore mostrato
è esattamente quello dichiarato dal Core (S050 riusa la normalizzazione rail di
S041) — "power passivo resta `UNVERIFIED` e richiede acknowledgement dove
previsto" (S050 § Verifiche). L'"acknowledgement" richiesto, quando applicabile,
è un'azione esplicita separata (non coperta in dettaglio da questo task — natura
e superficie esatta dell'acknowledgement sono definite dall'implementazione di
S050, questo documento non inventa un flusso specifico non ancora specificato lì).

## Tray "Candidati rilevati" (discovery)

1. Le card mostrate provengono dall'integrazione discovery candidate di S050
   punto 7: "preview, confidence/authority, confronto, accettazione con
   key/Bay/rail scelta e rifiuto senza side effect".
2. "Accetta" invoca il comando di dominio che applica il candidato con la sua
   key/Bay/rail proposta — produce **sempre** un diff esplicito prima
   dell'applicazione (S050 § Verifiche: "accettare discovery produce un diff
   esplicito e non applica automaticamente") — l'anteprima diff mostrata nella
   card in `visual.md` è quel diff, non una descrizione approssimativa.
3. "Rifiuta" non ha alcun side effect sul progetto (S050 punto 7, garanzia
   esplicita) — la card scompare dal tray, nessun comando viene registrato nella
   `CommandStack`.

## Connector separato dalla Bay

Cambiare il Connector (pinout/connettore) di un nodo non trasforma
automaticamente l'interfaccia elettrica associata (S050 punto 5) — nella UI
questo significa che modificare il campo Connector nell'Inspector non altera mai
silenziosamente Modalità elettrica o Power rail già configurati altrove; se la
combinazione risultante non è valida, si applica la stessa gestione errore di
campo isolato descritta in `visual.md`.

## Config hash

Coerente con `REACT_FLOW_ARCHITECTURE.md`: "cambiare label/posizione non cambia
Config hash" (S050 § Verifiche) — spostare un nodo sul canvas o rinominarlo non
marca la composizione come `PROJECT_DIRTY` ai fini del confronto con il Core
(`UX-S030`), solo una modifica che tocca il Config deployabile lo fa.

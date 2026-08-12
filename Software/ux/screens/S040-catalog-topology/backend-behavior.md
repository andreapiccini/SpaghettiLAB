# Catalog & Topology Explorer — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale dato/operazione reale alimenta ciascuna vista descritta in `visual.md`. Fonti:
S041 (normalizzazione catalogo/topologia, ⬜ TODO), S042 (`EditorModel`, form e
compatibility engine, ⬜ TODO), S043 (adapter React Flow, ⬜ TODO) — nessuna delle tre
è ancora implementata; questo file descrive cosa dovrebbe alimentare la schermata una
volta che lo sono, coerente con la convenzione di `roadmap/ux-v1/README.md`.

## Caricamento (mount)

1. Catalogo e topologia mostrati provengono dagli **indici normalizzati** prodotti da
   S041 (Module Driver, Rule, Block, opcode, Profile, Capability Pack per il
   catalogo; Flow, Port, Function Bay, cinque segnali, rail e admission per la
   topologia) — mai dai dati grezzi letti dal Core, che S041 esiste apposta per
   trasformare in indici stabili indipendenti dall'ordine di lettura.
2. Il badge fingerprint nell'header (`visual.md`) è il catalog fingerprint già
   usato da S030 per la cache — la stessa identità, mostrata qui per verifica
   visiva.

## Badge compatibilità (Catalogo)

- "Compatibile"/"Deprecato"/"Incompatibile" derivano dal **compatibility engine**
  di S042 punto 3 (basato su schema, tipo, unità, semantic/reference group,
  direzione, Flow/Bay e capability) — non da un flag statico per tipo.
- Il dettaglio in linea di ogni voce (campo/valore, schema/unità/enum/capability)
  è esattamente il descrittore di `EditorModel` prodotto da S042 punto 1 — lo
  stesso modello che alimenta i form dell'Inspector nel Processing Graph Editor
  (S070), reso qui in sola lettura invece che come form editabile. Questo è il
  collegamento concettuale fra le due schermate richiesto dal task: stessa fonte
  dati (`EditorModel`), presentazioni diverse.

## Badge rail (Topologia)

Il testo `ENFORCED`/`UNVERIFIED` è **esattamente** quanto normalizzato da S041
punto 2 dalla dichiarazione del Core — S041 § Verifiche garantisce esplicitamente
che "una rail dichiarata `UNVERIFIED` dal Core non viene normalizzata come
`ENFORCED`". La UI non deve mai promuovere/declassare questo valore per
semplificare la presentazione.

## Placeholder diagnostico (tipo mancante/sconosciuto)

Corrisponde esattamente al placeholder diagnostico che S042 punto 4 richiede: "tipi
mancanti o versione non disponibile" vengono conservati (mai cancellati) e
accompagnati da una remediation (installare un pack, aggiornare il firmware) — la
UI qui si limita a mostrare l'identificatore grezzo e il testo di remediation che
S042 fornisce, senza logica propria di interpretazione del tipo sconosciuto.

## Stato "parziale" (lettura interrotta)

S041 § Verifiche garantisce esplicitamente che "catalogo/topologia parziali
(lettura interrotta) non producono un indice apparentemente completo" — il flag che
attiva il banner "lettura parziale" in `visual.md` viene da questo stesso segnale
di S041, non da un timeout euristico lato UI. "Riprova lettura" richiama di nuovo
la sincronizzazione di S030 (già usata da `UX-S030`) per rileggere catalogo e
topologia.

## Nessuna mutazione

Nessuna azione in questa schermata invoca un comando di dominio (S014) o
un'operazione di scrittura verso il Core — è coerente con l'obiettivo esplicito del
task: "puramente diagnostico/informativo, nessuna modifica qui". L'unica operazione
di rete possibile è la rilettura (S030), mai una scrittura.

## Collegamento all'adapter React Flow (S043)

Questa schermata **non usa** l'adapter React Flow di S043 (non c'è canvas qui) —
menzionato solo perché conferma che l'`EditorModel` mostrato in sola lettura qui è
la stessa fonte che, nel Processing Graph Editor, S043 traduce in nodi/handle
trascinabili: un tipo nuovo che compare in questa vista comparirà, senza patch
separate, anche nella Palette di S070.

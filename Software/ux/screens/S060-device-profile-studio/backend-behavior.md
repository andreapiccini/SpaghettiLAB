# Device Profile Studio — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Fonti: S061 (modello authoring ed editor istruzioni, ⬜ TODO), S062
(budget locale, import/export e resolver, ⬜ TODO), S063 (installazione, catalogo e
sorgenti profilo, ⬜ TODO) — nessuna ancora implementata; questo file descrive cosa
dovrebbe partire una volta che lo sono, coerente con la convenzione di
`roadmap/ux-v1/README.md`.

## Editing (tab Metadata/Transport/Istruzioni/Output)

1. Ogni campo del form scrive nel **modello authoring** di S061 punto 1
   (metadata, transport, capability/elettrico, identity probe, init, sample,
   event, command, safe-stop, output schema) — nessuna chiamata di rete per la
   sola compilazione, coerente con l'obiettivo di S061: "senza ancora occuparsi
   di import/export o installazione".
2. La sequenza di step nella tab Istruzioni corrisponde esattamente all'editor
   funzionale di S061 punto 2 (transazioni I2C/SPI/UART, GPIO/ADC, wait bounded,
   byte operations, mask/shift/sign, CRC, emit) — l'ordine visivo delle righe è
   l'ordine reale di esecuzione nel modello, non solo un'etichetta.
3. Fixed-point, endian, signedness, unità, field ID e versionamento (S061 punto
   3) sono derivati dai campi del form, mai da una formula libera — coerente
   con "senza formule JavaScript arbitrarie" (S061 punto 3): l'editor espone
   solo i parametri strutturati che quella regola permette, mai un campo
   "espressione".
4. Un profilo/field/schema duplicato o un loop/timeout/buffer non valido
   restituisce un `DomainError` con path preciso (S061 § Verifiche) — mostrato
   come errore di campo isolato nel dettaglio dello step corrispondente.

## Vincolo elettrico da Bay

Il banner "Vincoli da Bay" (`visual.md`) legge la Bay associata dal Physical
Composition Graph (S050) — **mai un valore inserito nel testo del profilo** (S061
§ Fine task: "i vincoli elettrici derivano dalla Bay, non dal testo del
profilo"). Se il profilo non è ancora collegato a nessun Module/Bay, non c'è
nulla da leggere e il banner mostra lo stato "nessuna Bay associata".

## Budget locale e resolver (pannello Compatibilità)

1. Il calcolo worst-case (operation count, byte, timeout, temporanei, output) è
   quello di S062 punto 1 — **locale**, confrontato con i limiti del Core
   selezionato **prima di qualunque validate remota** (S062 punto 1, garanzia
   esplicita). Il "Dettaglio budget" in `visual.md` mostra esattamente questi
   valori.
2. L'esito mostrato (una delle sei card) viene dal resolver di S062 punto 3 —
   stesso set di esiti già usato concettualmente da `REACT_FLOW_ARCHITECTURE.md`
   § Device Profile e Capability Pack e riportato identico qui.
3. Un opcode assente porta l'esito a `FIRMWARE_UPDATE_REQUIRED`, mai a un
   `READY` falso ottenuto ignorando la dipendenza (S062 § Verifiche: "import di
   un package con dipendenze opcode dichiarate ma non installate risolve a
   `FIRMWARE_UPDATE_REQUIRED`, non a un falso `READY`") — questo è esattamente
   il comportamento dietro il badge inline "Opcode non installato" e l'azione
   "Proponi Capability Pack" (mai un'installazione dati tentata dalla UI stessa,
   S062 § Verifiche: "un opcode assente propone Capability Pack e non tenta
   un'installazione dati").

## Import/export

1. "Esporta" genera il package profilo canonico di S062 punto 2 (ID, versione,
   hash, autore, compatibilità, dipendenze opcode) — l'anteprima mostrata prima
   del download è quel package già calcolato, non una ricostruzione separata
   lato UI.
2. "Importa" legge il package ma **non ne esegue mai il contenuto** (S062 punto
   2, garanzia esplicita) — l'anteprima nel dialogo (`visual.md`) è puramente
   lettura dei metadati/struttura dichiarati nel pacchetto.
3. Un profilo esportato e reimportato produce lo stesso hash (S062 § Verifiche)
   — l'hash mostrato nell'anteprima import deve coincidere con quello mostrato
   nell'anteprima export dello stesso profilo, altrimenti è un segnale di
   corruzione/manomissione del pacchetto, non solo un dettaglio informativo.

## Installazione ed instanziazione come Module

1. "Installa profilo" (esito `PROFILE_INSTALL_REQUIRED`) avvia l'installazione
   atomica di S063 punto 1 con verifica hash post-install; un'installazione
   interrotta non cambia il catalogo (S063 § Verifiche) — la UI resta
   sull'esito precedente finché l'installazione non è confermata riuscita, mai
   uno stato intermedio "quasi installato".
2. "Instanzia come Module" (esito `READY`) porta l'utente in Physical
   Composition (`UX-S050`) per configurare Port/Bay/indirizzo/label/calibrazione
   del nuovo Module (S063 punto 2) — questa schermata non duplica quel form,
   si ferma al passaggio di contesto.
3. Un profilo built-in, locale o da marketplace index appare con la stessa
   interfaccia una volta installato (S063 punto 3, "risultano indistinguibili
   una volta installati") — nessuna sezione separata "marketplace" in questa
   schermata; quella distinzione vive solo in `UX-S100` (Capability Marketplace).
4. Un profilo già in uso da un Module esistente non può essere rimosso o
   sostituito (S063 § Verifiche) — l'azione "elimina profilo" (non descritta a
   parte in `visual.md`, riusa lo stesso pattern "conferma distruttiva" di
   `UX_ARCHITECTURE.md`) è disabilitata con motivazione esplicita in quel caso.

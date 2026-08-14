# Modalità base / avanzata — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque
chiamata di rete/SDK. Token di movimento da `UX_ARCHITECTURE.md` § Sistema
di animazione.

## Toggle

- Click sullo switch (overflow o Settings): lo stato visivo cambia
  immediatamente (`motion.spring.snappy` sul thumb). Non c'è stato
  "salvataggio in corso" — la preferenza è locale e sincrona dal punto di
  vista UI.
- Accendere avanzata: le voci/tab nascoste entrano con fade
  `motion.duration.fast` (non spring: sono icone di navigazione, non
  elementi nuovi creati dall'utente).
- Spegnere avanzata: le voci escono con lo stesso fade. Se la schermata
  attiva è fra quelle nascoste, si naviga a Core Connections **senza
  dialogo** (non è una perdita di dati). L'Inspector di quella schermata si
  chiude con `motion.spring.smooth` come ogni chiusura Inspector.
- Lo switch **non** è undo-abile (`⌘Z` non lo ripristina): non è un comando
  di progetto.

## Command palette (`⌘K`)

In modalità base le voci "Vai a:" verso schermate nascoste **non compaiono**
nemmeno cercandole. Una voce d'azione "Attiva modalità avanzata" resta
cercabile, così chi sa che esiste può usarla da tastiera. In avanzata la
voce speculare è "Disattiva modalità avanzata".

## Banner "configurazione avanzata presente"

- Comparsa: fade `motion.duration.base` quando si apre un progetto che ha
  artifact avanzati **e** la modalità è base. Non pulsa, non è uno
  skeleton.
- "Mostra": stesso effetto del toggle verso avanzata; il banner esce con
  fade `motion.duration.fast`.
- Chiudere il progetto o passare ad avanzata: il banner non resta.

## Cosa non succede

- Nessuna conferma "sei sicuro?" sul toggle.
- Nessuna cancellazione visiva di nodi, profili, grafi o pack: restano nel
  progetto, solo la chrome li nasconde.
- Gli errori (banner di sessione, toast di deploy fallito) restano visibili
  in entrambe le modalità; non si nasconde un guasto perché "è avanzato".

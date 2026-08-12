# Capability Marketplace & OTA — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Tab (segmented control principale e sotto-selettore Marketplace)

Stesso comportamento del selettore vista di `UX-S040`: indicatore attivo scivola
con `motion.spring.snappy`, contenuto crossfade `motion.duration.base`.

## Tab Marketplace

- Card pack in hover: `elevation.1→elevation.2`, nessuno spostamento verticale
  (stesso principio delle righe dense di `UX-S030`/`UX-S050`, qui applicato a
  card invece che righe — l'informazione (trust/stato) è densa quanto quella
  delle righe).
- Cambio sotto-lista (Disponibili/Installati/Richiesti): crossfade
  `motion.duration.base` sulla griglia intera.
- Ricerca: filtro istantaneo, nessun debounce (stesso principio di S010/S030).

## Tray dettaglio pack

- Entra da destra con `motion.spring.smooth` (`translateX`), stesso pattern del
  tray candidati di `UX-S050`.
- Righe dipendenza: entrano con `motion.stagger.list` al primo render del tray.
- Pulsante "Installa" disabilitato → abilitato: nessuna animazione speciale, il
  cambio di stato (opacità/cursore) è istantaneo appena la valutazione delle
  dipendenze è disponibile.

## Tab Preflight

- Righe checklist: entrano con `motion.stagger.list` al caricamento del
  candidato.
- Icona esito di una riga che cambia (es. da "in verifica" a riuscita/fallita):
  crossfade `motion.duration.base`, mai uno scatto secco — anche se la verifica
  è quasi istantanea, la transizione resta coerente con la regola generale.
- Tabella budget: nessuna animazione sui valori (sono dati statici di un
  confronto già calcolato, non una barra che si riempie in tempo reale).
- Banner esito finale: entra con `motion.duration.base` (fade + `translateY
  -4px→0`) quando tutte le righe della checklist hanno un esito.

## Tab Aggiornamento (OTA)

- **Indicatore versione attiva**: la pillola "In prova" compare con
  `motion.spring.bouncy` nel momento in cui il trial inizia (elemento nuovo che
  richiede attenzione), scompare con fade `motion.duration.base` alla conferma
  o al rollback.
- **Stepper**: stesso comportamento di `UX-S080` § Pipeline — tappa "in corso"
  con pallino pulsante (opacità 1200ms loop), transizione fra tappe con
  `motion.spring.snappy` (scala 1→1.1→1), linea di connessione che si riempie
  con `motion.duration.base`.
- **Barra di progresso "Avanzamento"**: la larghezza segue il valore reale
  ricevuto (vedi `backend-behavior.md`), transizione `motion.duration.base` fra
  un aggiornamento e il successivo — mai un'animazione a tempo indipendente dal
  dato reale (nessuna barra "finta" che avanza da sola).
- **Countdown "Prova"**: il numero secondi si aggiorna ogni secondo senza
  animazione (è un valore discreto, un'animazione lo renderebbe meno leggibile),
  ma il contenitore della pillola pulsa leggermente in opacità come gli altri
  stati transitori.
- **Banner Rollback**: entra con `motion.spring.smooth` (mai bouncy — è uno
  stato rassicurante che deve sembrare stabile, non un rimbalzo "eccitato"),
  icona `ShieldCheck` non pulsante — stato finale stabile, non un caricamento.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

# Runtime & Diagnostics — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Tab (segmented control)

Stesso comportamento del selettore vista di `UX-S040`: indicatore attivo scivola
con `motion.spring.snappy`, contenuto crossfade `motion.duration.base`. Lo stato
"quale tab" persiste solo per la sessione.

## Tab Telemetria

- Nuovi record in stream "Live": entrano dal basso con `motion.duration.fast`
  (fade, non spring — è uno stream continuo ad alta frequenza, uno spring per
  ogni riga sarebbe eccessivo e distrarrebbe). Con "Live" in pausa, nessuna
  nuova riga entra finché non si riprende.
- **Riga di gap**: entra con `motion.spring.bouncy` (stesso token di "comparsa
  di un elemento nuovo" — un gap è un evento che merita attenzione, a
  differenza del normale flusso di record).
- Toggle Live/Pausa: icona `Pause`↔`Play` cambia con `motion.spring.snappy`.
- Auto-scroll: quando "Live" è attivo, lo stream scorre automaticamente verso il
  basso ad ogni nuovo record; uno scroll manuale dell'utente verso l'alto
  disattiva automaticamente l'auto-scroll (non il toggle "Live" stesso, che
  resta indipendente — l'utente può restare "in ascolto" mentre legge la
  cronologia) finché non torna in fondo.

## Tab Comandi

- Espansione form comando: altezza `0→auto`, 200ms, `cubic-bezier(0.22,1,0.36,1)`
  — stessa easing anti-jank di ogni accordion dell'app.
- Validazione locale del form (campi obbligatori, range) prima che "Esegui" sia
  cliccabile — stesso principio "errore isolato di campo prima del backend" già
  stabilito ovunque.
- Click su "Esegui": il pulsante si comprime (`scale 0.98`, `motion.spring.snappy`)
  — feedback che il click è stato registrato, indipendente da quanto richiede
  l'esecuzione reale (vedi `backend-behavior.md`).
- Badge esito: entra con `motion.spring.bouncy` accanto al form appena eseguito,
  resta visibile finché non si esegue di nuovo lo stesso comando (poi il vecchio
  badge esce in crossfade `motion.duration.base` sostituito dal nuovo).
- Nuova riga nel log comandi: entra con `motion.stagger.list` se più righe
  arrivano insieme, altrimenti singolo fade `motion.duration.fast`.

## Tab Discovery

- Dialogo avviso policy invasiva: stesso pattern di apertura di tutti i dialoghi
  già confermati (`motion.spring.smooth`, overlay fade `motion.duration.base`).
- Card candidato: hover `elevation.1→elevation.2`, click su Accetta/Rifiuta la
  comprime (`scale 0.98`) poi esce con fade, stesso comportamento del tray in
  `UX-S050`.
- Pallino "in corso" dello stepper minimale di scansione: stessa animazione di
  opacità pulsante 1200ms già usata per gli stati transitori altrove
  (`UX-S030`, `UX-S080`).

## Tab Stato & Risorse

- Chip di stato: espansione dettaglio in linea, stessa easing 200ms
  dell'accordion. Cambio colore di un chip (es. da `color.success` a
  `color.warning`) sempre in crossfade `motion.duration.base`, mai uno scatto.
- Barre resource monitor: la larghezza del riempimento anima con
  `motion.duration.base` quando il valore cambia (mai uno scatto secco), ma
  **non è un'animazione continua** — si aggiorna solo quando arriva un nuovo
  valore reale (vedi `backend-behavior.md`), non con un ciclo temporale
  artificiale.
- Contatore "Allocation failures" che passa da 0 a `>0`: il numero appare con
  `motion.spring.bouncy` (stesso principio "comparsa di un elemento nuovo che
  richiede attenzione" della riga di gap in Telemetria).

## Tab Amministrazione

- Dialogo di conferma distruttiva: `elevation.3`, stesso pattern di apertura
  standard. Il campo "scrivi il nome del target" (quando richiesto) mantiene il
  pulsante di conferma disabilitato finché il testo non corrisponde esattamente
  — nessuna tolleranza silenziosa (case-insensitive o trim) non dichiarata.
- Pulsante disabilitato per permesso mancante: tooltip al hover prolungato
  (400ms), stesso timing già usato per i tooltip di `UX-S010`.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

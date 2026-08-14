# Core Connections — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Pallino di stato pulsante

Gli stati transitori (`CONNECTING`, `AUTHENTICATING`, `SYNCHRONIZING`, `VALIDATING`,
`APPLYING`, `UPDATING`, `REBOOTING`, `TRIAL`) mostrano il pallino 6×6px del badge con
un'animazione di opacità in loop (`0.4 → 1 → 0.4`, 1200ms, easing lineare, loop
infinito) — segnale "sta succedendo qualcosa" puramente locale, non un progresso
reale (il progresso reale, quando misurabile, è testuale — vedi
`backend-behavior.md`). Gli stati stabili (`READY`, `DISCONNECTED`, `ERROR`,
`CONFLICT`, `ROLLED_BACK`) non pulsano mai.

## Transizioni di badge

Quando lo stato di sessione di una riga cambia, il badge vecchio esce e il nuovo
entra con crossfade `motion.duration.base` (mai uno scatto secco) — coerente con la
regola generale "stati di caricamento → contenuto" di `UX_ARCHITECTURE.md`. Il badge
di relazione progetto/dispositivo, quando appare per la prima volta al raggiungimento
di `READY`, usa `motion.spring.bouncy` (è un elemento nuovo che compare, non una
transizione fra due stati dello stesso badge).

## Azione per riga secondo lo stato

L'azione secondaria mostrata a destra della riga (vedi `visual.md`) cambia testo
secondo lo stato — nessuna delle seguenti apre mai un'azione automatica al
riconnettersi, coerente con la regola esplicita di `UX-S030`: mai auto-apply.

| Stato | Azione mostrata |
|---|---|
| `DISCONNECTED` (mai connesso) | "Connetti" |
| `DISCONNECTED` con badge stale | "Riconnetti" |
| `CONNECTING`/`AUTHENTICATING`/`SYNCHRONIZING` | "Annulla" |
| `READY` + `IN_SYNC` | Nessuna azione necessaria — solo il badge |
| `READY` + `PROJECT_DIRTY` | "Invia al Core" |
| `READY` + `DEVICE_CHANGED` | "Rivedi modifiche" |
| `READY` + `DIVERGED` | "Confronta e riconcilia" |
| `READY` + `INCOMPATIBLE` | "Dettagli incompatibilità" |
| `CONFLICT`/`ERROR` | "Rivedi errore" |
| `ROLLED_BACK` | "Vedi cosa è cambiato" |

Click su un'azione che apre una vista (Rivedi modifiche/Confronta e
riconcilia/Dettagli incompatibilità/Rivedi errore) espande la riga stessa in linea
(altezza `auto`, `motion.duration.base`, non un dialogo separato — il contesto
resta visibile) mostrando il dettaglio; non naviga fuori dalla schermata.

## Riga in hover

`elevation.1 → elevation.2`, nessuno spostamento verticale (a differenza delle card
del project picker, qui la densità informativa è più alta e uno spostamento
distrarrebbe).

## Dialogo "Connetti un Core"

1. Click su "+ Connetti un Core" → dialogo entra con `motion.spring.smooth`
   (`opacity 0→1`, `scale 0.97→1`), overlay fade `motion.duration.base`.
2. Selettore metodo: cambiare fra "Auto", "Core in rete" e "Core via cavo"
   fa comparire il campo o la lista con `motion.duration.fast` (fade, l'altezza
   del dialogo si adatta senza spring — stessa motivazione della riga categoria in
   S070: l'altezza "auto" con spring produce jank).
3. Lista risultati scansione: ogni riga trovata entra con
   `motion.stagger.list` (30ms fra una riga e la successiva) — rende visibile che
   la scansione sta ancora trovando dispositivi, non un'apparizione istantanea in
   blocco.
4. Validazione locale "Indirizzo manuale": il pulsante "Connetti" resta
   disabilitato finché il campo non è un indirizzo sintatticamente valido — nessuna
   chiamata di rete per questa verifica.
5. Chiusura (Annulla, `Escape`, click fuori): stessa animazione di apertura,
   invertita.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

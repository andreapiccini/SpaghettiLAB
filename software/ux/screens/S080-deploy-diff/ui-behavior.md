# Deploy & Diff — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Selettore Core target

Selezione/deselezione di una pillola Core: `motion.spring.snappy` sul cambio
bordo/sfondo — micro-interazione immediata, coerente con la regola generale.
L'area diff sotto fa crossfade `motion.duration.base` quando cambia il set di
Core selezionati (mostra l'unione dei diff, o il diff del singolo Core se uno
solo è selezionato).

## Accordion diff per tipo entità

Espansione/collasso sezione: altezza `0→auto`, 200ms,
`cubic-bezier(0.22,1,0.36,1)` — stessa easing anti-jank di ogni altro accordion
dell'app. Righe che compaiono in una sezione appena espansa: `motion.stagger.list`.

## Dettaglio campo ("Vedi campi" su una riga Modificato)

Espansione in linea: stessa easing 200ms dell'accordion. Nessuna evidenziazione
temporanea del valore nuovo (il colore/barratura è già sufficiente a comunicare
prima/dopo, un flash aggiuntivo sarebbe ridondante qui).

## Pipeline — stepper

- Tappa "in corso": il pallino interno del cerchio pulsa in opacità (`0.4 → 1 →
  0.4`, 1200ms, loop infinito) — stesso pattern già usato per gli stati
  transitori di sessione in `UX-S030`, non un progresso percentuale reale.
- Transizione fra tappe (in attesa → in corso → riuscita/fallita): il cerchio
  cambia stato con `motion.spring.snappy` (scala 1→1.1→1 al momento del cambio,
  breve conferma "è successo qualcosa proprio ora"), la linea di connessione
  verso la tappa precedente si riempie con `motion.duration.base` (da
  tratteggiata/vuota a piena, se riuscita) invece che apparire di colpo.
- Tappa fallita: il cerchio rosso non pulsa (stato stabile, richiede
  un'azione, non un'attesa).

## Pannello conflitto

Entra sostituendo l'area diff con crossfade `motion.duration.base` (non uno
spring — è un cambio di contesto importante, deve essere leggibile subito, non
"rimbalzare" per attirare l'attenzione in modo eccessivo su una situazione già
delicata). Le tre azioni non hanno alcuna enfasi animata reciproca — nessuna
delle tre pulsa o si ingrandisce per suggerire una preferenza.

## Banner blocco profili/pack mancanti

Entra con `motion.duration.base` (fade + `translateY -4px→0`), resta fisso
finché la condizione non è risolta (nessuna animazione ciclica, non è uno stato
di attesa ma un blocco che richiede un'azione altrove).

## Report multi-Core

Ogni riga aggiorna il proprio esito in modo indipendente con crossfade
`motion.duration.base` quando cambia (da "in corso" a "riuscito"/"fallito") — le
righe degli altri Core non si muovono né cambiano quando una riga si aggiorna,
coerente con l'isolamento visivo richiesto.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

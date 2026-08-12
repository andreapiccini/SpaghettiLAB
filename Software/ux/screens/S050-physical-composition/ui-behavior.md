# Physical Composition Editor — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Canvas

Drag di nodi, pan/zoom, selezione: stesso comportamento immediato (nessuna
animazione in ritardo dietro il gesto) già stabilito per il canvas React Flow in
S070 § Convenzione — regola generale, non ripetuta lì. Comparsa di un nuovo nodo
(es. dopo aver accettato un candidato dal tray): `motion.spring.bouncy`, coerente
con "comparsa di un elemento nuovo" di `UX_ARCHITECTURE.md`.

## Lista Module dentro un nodo

- Espansione/collasso della sezione Module: altezza `0→auto`, 200ms,
  `cubic-bezier(0.22,1,0.36,1)` (stessa motivazione anti-jank già usata per
  l'accordion della Palette in S070 e del Catalog Explorer in S040).
- Click su "+ Aggiungi Module": apre l'Inspector con un form vuoto (nessun
  Module creato finché non si salva un indirizzo valido — vedi
  `backend-behavior.md`), l'Inspector entra con `motion.spring.smooth`.
- Riga Module in collisione: nessuna animazione ciclica (non è uno stato di
  caricamento) — il colore d'errore è permanente finché il conflitto non è
  risolto.

## Form Module nell'Inspector

- Validazione locale immediata per campo (formato indirizzo, range chip-select
  se numerico) — bordo `color.error` + messaggio sotto il campo, stesso principio
  di S070 § Inspector, **prima** di qualunque verifica di collisione che
  richiede il resto della composizione (quella è descritta in
  `backend-behavior.md`, non è puramente locale perché dipende dagli altri
  Module già configurati).
- Banner collisione: entra con `motion.duration.base` (fade + `translateY
  -4px→0`) sopra i campi quando compare, esce allo stesso modo quando risolta.
  Click su "Cambia indirizzo" fa `scroll_to` + focus sul campo Indirizzo,
  bordo del campo pulsa una volta (`scale` non applicabile a un campo di testo —
  usare invece un breve `outline` flash 2px `color.error` per 400ms) per attirare
  l'attenzione senza essere invasivo.

## Tray "Candidati rilevati"

1. Click su "Candidati" nell'header → tray entra da destra con
   `motion.spring.smooth` (`translateX` dal bordo destro, non un semplice fade —
   coerente con "pannelli laterali" di `UX_ARCHITECTURE.md` § Dove il movimento
   conta di più).
2. Card candidato: hover solleva leggermente ombra (`elevation.1→elevation.2`,
   nessuno spostamento — stessa scelta della riga Core Connections in S030, alta
   densità informativa).
3. Click su "Accetta": la card si comprime (`scale 0.98`, `motion.spring.snappy`)
   poi esce dalla lista con un breve fade (`motion.duration.base`) mentre le
   card sotto scivolano su per riempire lo spazio — il nodo/Module corrispondente
   compare sul canvas con `motion.spring.bouncy` (vedi sopra), **non prima** che
   la card sia stata confermata (nessuna anteprima già "quasi applicata" sul
   canvas mentre la card è ancora nel tray).
4. Click su "Rifiuta": la card esce con lo stesso fade, nessun effetto sul
   canvas.
5. Chiusura tray (pulsante X o click fuori): esce con la stessa animazione
   d'ingresso, invertita — i candidati non ancora decisi restano in coda, il
   tray si riapre nello stesso stato se richiamato di nuovo.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

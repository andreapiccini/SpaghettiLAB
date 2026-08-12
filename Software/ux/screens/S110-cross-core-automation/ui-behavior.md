# Cross-Core Automation — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Tab (segmented control)

Stesso comportamento del selettore vista di `UX-S040`: indicatore attivo scivola
con `motion.spring.snappy`, contenuto crossfade `motion.duration.base`.

## Tab Grafo

- Drag/pan/zoom/selezione: stesso comportamento immediato del canvas React Flow
  già stabilito in S070/S050 — nessuna animazione in ritardo dietro il gesto.
- Comparsa di un nuovo nodo o edge: `motion.spring.bouncy` (elemento nuovo).
- **Pallino stato connessione** sul nodo: quando lo stato è transitorio
  (`CONNECTING`/`SYNCHRONIZING`/…, stessa mappa di `UX-S030`), pulsa in opacità
  (1200ms loop) — stabile altrimenti.

### Chip trasformazione

- Popover di scelta trasformazione: entra con `motion.duration.fast` (fade +
  `translateY -4px→0`), coerente con gli altri popover piccoli dell'app.
- Selezionare una trasformazione valida: il chip passa da bordo `color.warning`
  a stile "neutro" (bordo `color.border-strong`) con crossfade
  `motion.duration.base`, l'edge tratteggiato rosso (se era incompleto) diventa
  una linea piena con la stessa transizione.
- Handle "drop rifiutato" durante un tentativo di collegamento incompatibile
  senza trasformazione disponibile: stesso pulsare `1→1.15→1` già definito in
  S070 § Anatomia del nodo — Handle.

### Link stale

Nessuna animazione ciclica sul chip "Link non rivalidato" (stato stabile, non
un caricamento). Click su "Rivalida": il chip mostra un pallino pulsante
temporaneo (1200ms) finché la rivalidazione non risponde, poi transizione
crossfade verso lo stato risolto (edge normale) o verso un nuovo stato di
errore se la rivalidazione fallisce.

## Tab Deploy Node-RED

- Banner di scope: sempre presente, nessuna animazione (è informativo
  permanente, non un evento).
- Diff: stesso comportamento accordion/righe di S080 § Diff semantico
  (`motion.stagger.list` per righe, crossfade per badge sync che cambia).
- Pannello `DIVERGED` (tre azioni): stesso comportamento del pannello
  conflitto di `UX-S080` — crossfade `motion.duration.base` nel sostituire
  l'area diff, nessuna enfasi animata su una delle tre azioni rispetto alle
  altre.

## Tab Diagnostica

- Chip di tappa che cambia stato (online↔offline, nuovo valore ricevuto):
  crossfade `motion.duration.base` sul contenuto del chip, il timestamp si
  aggiorna senza animazione propria (è testo, non una barra).
- Tappa che passa a offline: l'opacità scende a 60% con transizione
  `motion.duration.base` (non uno scatto secco a "spento").
- Nuova riga nel log eventi: `motion.stagger.list` se più righe arrivano
  insieme, altrimenti fade singolo `motion.duration.fast` — stesso principio
  già usato per lo stream telemetria di `UX-S090`.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

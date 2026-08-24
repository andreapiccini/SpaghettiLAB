# Catalog & Topology Explorer — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Selettore vista (Catalogo / Topologia)

Cambio voce: la voce attiva scivola con `motion.spring.snappy` (stesso token della
selezione nel left rail), il contenuto sotto fa crossfade `motion.duration.base` —
non uno scatto secco fra le due viste. Lo stato scelto (quale vista) persiste solo
per la sessione, non è salvato nel progetto.

## Accordion catalogo

- Espansione/collasso categoria: stessa animazione della Palette in S070 — altezza
  `0→auto`, **durata 200ms, easing `cubic-bezier(0.22,1,0.36,1)`**, non spring (per
  lo stesso motivo: spring su altezza "auto" produce jank).
- Righe che compaiono dentro una categoria appena espansa: `motion.stagger.list`
  (30ms fra riga e riga).
- Hover riga: sfondo `color.surface-raised`, nessun cambiamento di elevazione (è
  una lista densa e sola lettura, non una card).

## Dettaglio in linea (click su una riga)

- Espansione: altezza `0→auto` con la stessa easing 200ms dell'accordion — coerenza
  fra i due livelli di espansione.
- Solo un dettaglio aperto per volta *dentro la stessa categoria* (aprirne un
  secondo chiude il primo, evita un accordion infinito che scorre via) — le
  categorie diverse restano indipendenti fra loro.
- Icona chevron `ChevronDown`/`ChevronUp` accanto al nome ruota 180° in sync con
  l'espansione.

## Vista Topologia

- Espansione/collasso di un nodo dell'albero (Flow/Bay): stessa easing 200ms
  dell'accordion catalogo, per coerenza visiva fra le due viste.
- Hover su una riga Port mostra un tooltip (400ms delay) col nome tecnico completo
  se troncato.

## Placeholder diagnostico

Il badge/riga con `TriangleAlert` non pulsa e non lampeggia — è uno stato stabile
noto, non un caricamento. L'espansione del dettaglio/remediation segue la stessa
animazione del dettaglio in linea standard.

## Banner "lettura parziale"

Entra con `motion.duration.base` (fade + `translateY -4px→0`) al comparire,
resta fisso (nessuna animazione ciclica — non deve sembrare un progresso in corso,
è uno stato che richiede un'azione esplicita "Riprova lettura").

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).

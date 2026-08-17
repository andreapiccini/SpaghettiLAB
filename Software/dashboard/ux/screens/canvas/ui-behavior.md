# Canvas — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

Zero rete. Tutto qui è locale.

## Visualizza

- Tap card → apre point-detail (sheet).
- I valori animano al cambio (numero, arco gauge, sparkline, impeller).
- Switch / button sulla card inviano il comando (il parent fa l’host call).

## Modifica

- Toggle "Modifica": slot tratteggiato in coda apre il widget-picker.
- Kiosk nasconde il toggle. Compatto riduce gutter e max extent.
- Reorder: fase 1 non obbligatorio.

## Pompa

- `visualState=running` → `AnimationController.repeat` (periodo ~1.2s subtle, ~0.9s standard, ~0.7s rich).
- `idle` → stop, angolo 0.
- La UI **non** calcola da sola running: solo lo stato ricevuto.

## Appearance

- Cambio colori/sfondo/motion: rebuild immediato, senza restart.
- Link "Personalizza aspetto" → schermata appearance (nav locale).

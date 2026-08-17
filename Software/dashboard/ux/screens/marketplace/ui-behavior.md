# Marketplace — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

- Tap **Applica** su un pack già in libreria → dialog di conferma (tema ± teaser vista).
- Pack store non installato: CTA **Installa** (verifica firma). Poi **Applica**.
- Sezione **Stili card**: **Scarica** oppure chip In libreria.
- Chip **Firmato** se `signed`.
- Annulla chiude; conferma chiama apply sul parent.
- Due canali: marketplace firmato e developer (SDK locale, senza firma).
- Nessun pagamento. Nessun eval Dart.

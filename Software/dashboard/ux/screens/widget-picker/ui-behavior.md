# Widget picker — UI behavior

[Visual](visual.md) · [Host](host-behavior.md)

- Filtro locale sul label (case-insensitive).
- Punti già sul canvas disabilitati.
- Dopo la selezione: stili **installati** compatibili (chip) + catalogo da **Scarica**.
- Conferma → pop con punto + `CardStyle` (hint + effect). `styleId` va sul widget del layout.
- Nessuna rete nel picker: catalogo già in memoria; Scarica chiama `installCardStyle`.

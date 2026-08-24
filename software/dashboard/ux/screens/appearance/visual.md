# Appearance — Visual

[← UX](../../README.md) · [UI](ui-behavior.md) · [Host](host-behavior.md)

Editor grafico della dashboard. Nessun editor di regole.

## Layout

- Desktop: due colonne. Sinistra editor (`max 420px`), destra anteprima canvas ridotta.
- Telefono: anteprima in alto (180px), editor sotto.
- Padding `space.lg`. Titolo `type.heading` "Aspetto".

## Sezioni editor (`color.bg.surface`, goccia: tre angoli `radius.lg`, punta basso-sinistra)

1. **Colori** — swatch accent 44×44, forma goccia. Selezionato: outline 2px bianco.
2. **Sfondo** — chip preset: Studio, Carta, Giardino, Sera.
3. **Animazioni** — Subtle / Standard / Rich (selettore a goccia, vetro).
4. **Menu** — Barra / Rail (stesso selettore).
5. **Brand** — campo nome (app bar), fill goccia.
6. **Ripristina default** — text button `color.text.secondary`.
7. Nota `type.caption`: "Le automazioni si configurano fuori da questa app."

## Anteprima

Mini canvas con 2 widget demo (gauge + pompa) che usano l’appearance corrente. Cambio swatch → rebuild `motion.fast`.

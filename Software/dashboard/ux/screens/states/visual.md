# Stati — Visual

[← UX](../../README.md) · [UI](ui-behavior.md) · [Host](host-behavior.md)

Componenti riusabili (`app/lib/widgets/app_states.dart`). Copy italiano neutro.

| Widget | Token | Copy default |
|---|---|---|
| `LoadingView` | spinner `color.accent`, `type.caption` | Caricamento… |
| `EmptyState` | `type.title` + `type.caption` | titolo + body + CTA opzionale |
| `OfflineBanner` | sticky, `color.offline` | Host non raggiungibile |
| `ErrorPanel` | titolo `color.error` | + Riprova |
| `AlarmChip` | `color.error` / `color.ok` | label stato |

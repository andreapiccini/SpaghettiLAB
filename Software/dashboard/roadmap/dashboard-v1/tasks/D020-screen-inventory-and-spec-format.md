# D020 — Inventario schermate e convenzione spec

**Stato:** ⬜ TODO
**Dipende da:** D010
**Blocca:** D021–D029, D051

## Obiettivo

Convenzione spec UX per dashboard **visual-first**.

## Struttura

```text
dashboard/ux/screens/<slug>/
  visual.md
  ui-behavior.md
  host-behavior.md
```

## Schermate (vincolante)

| Slug | Task | Focus |
|---|---|---|
| `connect` | D021 | Selezione sistema |
| `overview` | D022 | Panoramica live |
| `canvas` | D023 | Widget + animazioni |
| `widget-picker` | D024 | Aggiunta widget |
| `point-detail` | D025 | Dettaglio + comando manuale |
| `appearance` | D026 | Tema, sfondo, motion |
| `marketplace` | D029 | Browse theme pack |
| `settings` | D027 | Kiosk, connessione |
| `states` | D028 | Stati comuni |

**Non presente:** `automations` — automazioni fuori dashboard.

## Regole spec

- `visual.md` — token + override `THEMING.md`;
- `ui-behavior.md` — zero HTTP/WS;
- `host-behavior.md` — `HOST_API.md` only.

Documentare in `dashboard/ux/README.md`.

## Fine task

- [ ] `dashboard/ux/README.md` aggiornato.
- [ ] Nove cartelle schermata pronte.

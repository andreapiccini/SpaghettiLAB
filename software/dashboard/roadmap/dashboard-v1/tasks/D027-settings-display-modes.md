# D027 — Settings & display modes

**Stato:** ✅ DONE
**Dipende da:** D020
**Schermata:** `dashboard/ux/screens/settings/`

## Obiettivo

Impostazioni **sistema e display** — non editor grafico (quello è `appearance`).

## Cosa deve coprire

- Modalità **kiosk** (fullscreen, nascondi modifica layout).
- Modalità **compact** (densità widget).
- Connessione host (read-only).
- About / versione.
- Voce informativa: "Automazioni e integrazioni (Telegram, …) — Node-RED / editor
  avanzato" con link placeholder (no editor in app).
- Shortcut → Appearance, Marketplace.

## Implementazione richiesta

1. `visual.md` — grouped list; no color pickers here.
2. `ui-behavior.md` — kiosk toggle; navigazione a appearance/marketplace.
3. `host-behavior.md` — `GET capabilities`; optional `brandLocked`.

## Fine task

- [x] Tre file spec completi.

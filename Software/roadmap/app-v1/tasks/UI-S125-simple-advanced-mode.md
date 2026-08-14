# UI-S125 — Modalità base / avanzata (persistenza + shell)

**Stato:** ✅ DONE
**Spec UX:** [UX-S125](../../ux-v1/tasks/UX-S125-simple-advanced-mode.md) ·
[visual](../../../ux/screens/S125-simple-advanced-mode/visual.md) ·
[ui-behavior](../../../ux/screens/S125-simple-advanced-mode/ui-behavior.md) ·
[backend-behavior](../../../ux/screens/S125-simple-advanced-mode/backend-behavior.md)
**Pacchetti backend:** nessuno di dominio — `LocalStorageAdapter` in
`packages/app` (`Storage` di `@spaghettilab/domain`)

## Obiettivo

Un unico switch **base / avanzata** persistito sul browser. Primo avvio
(chiave assente) = **base**. La chrome (left rail, command palette, menu
`⋮`) rispetta la modalità dopo ogni reload, senza aspettare ⌘S e senza
scrivere nel `ProjectV1`.

## Implementazione richiesta

1. Store `ui.mode` (`base` | `advanced`) via `LocalStorageAdapter`, chiave
   `ui.mode` → `spaghettilab:ui.mode`. Parse fail-safe: tutto ciò che non è
   esattamente `advanced` è `base`. Test sul parse e sul round-trip.
2. Provider React: lettura sincrona al primo paint (niente flash avanzata
   al primo avvio), `set` immediato al toggle.
3. Menu overflow della top bar (`⋮`): riga "Modalità avanzata" + switch.
4. Left rail e command palette: filtrare le voci avanzate; gruppo vuoto non
   disegnato. Redirect a Core Connections se si spegne avanzata restando su
   una schermata nascosta.
5. Voce palette "Attiva/Disattiva modalità avanzata".

## Fuori da questo task (contratto già in spec, altri UI-S)

- Tab Interfaccia e filtro tab Settings → UI-S120.
- Filtro tab Runtime (nascondere Stato & Risorse / Amministrazione) → UI-S090.
- Badge "configurazione avanzata presente" → stesso task o follow-up quando
  il progetto espone un detector affidabile (profili authorati / SAG / OTA).

## Fine task

- [x] Chiave assente → base; valore `advanced` sopravvive al reload.
- [x] Toggle scrive subito; non passa da `ProjectRepository.save`.
- [x] Rail e palette in base nascondono Catalog, Device Profiles,
      Marketplace, Cross-Core.
- [x] Da una schermata nascosta, spegnere avanzata porta a Core Connections
      senza cancellare il progetto.
- [x] Test store (parse + round-trip) in CI.

## Implementazione (2026-08-14)

`packages/app/src/lib/ui-mode.ts`: parse fail-safe (`advanced` esatto, tutto
il resto `base`), chiave `ui.mode` → `spaghettilab:ui.mode`. Lettura
sincrona al primo paint (`readUiModeFromLocalStorage`) così la rail non
lampeggia avanzata al primo avvio. Scrittura immediata via
`LocalStorageAdapter.set`, fuori da `ProjectV1`.

Shell: menu `⋮` in `TopBar` (switch "Modalità avanzata"), filtro `LeftRail`
e `CommandPalette`, redirect in `App.tsx` se la schermata attiva non è
visibile. Test: `packages/app/src/lib/__tests__/ui-mode.test.ts`.

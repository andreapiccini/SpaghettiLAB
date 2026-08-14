# UX-S125 — Modalità base / avanzata (shell)

**Stato:** ✅ DONE
**Dipende da:** `UX_ARCHITECTURE.md` § Convenzioni cross-cutting (nessuna
dipendenza dalla roadmap backend)
**Fase backend collegata (riferimento):** nessuna — persistenza
`LocalStorageAdapter`, non S014/S122

## Obiettivo

Specificare lo switch **base / avanzata** come cross-cut di shell e
Settings, non come dodicesima schermata: cosa si nasconde, dove sta il
controllo, e come si memorizza l'impostazione ad ogni riavvio (primo avvio
= base).

## Cosa deve coprire

- Un solo switch persistito, default **base** se la chiave manca.
- Fuori da `ProjectV1`: non ride export / ⌘S / cambio progetto.
- Rail, palette e tab: nascondere estensione piattaforma, non l'uso del
  Core (connetti, Port+Module, bus, deploy, telemetria, credenziali).
- Dati avanzati già nel progetto: non cancellarli; badge se presenti.
- Scrittura immediata al toggle; round-trip reload.

## Implementazione richiesta

1. `ux/screens/S125-simple-advanced-mode/visual.md`
2. `ux/screens/S125-simple-advanced-mode/ui-behavior.md`
3. `ux/screens/S125-simple-advanced-mode/backend-behavior.md` — riferisce
   `LocalStorageAdapter` / `Storage.get|set("ui.mode")`, esplicitamente
   **non** `ProjectRepository`.
4. Convenzione in `UX_ARCHITECTURE.md` § Convenzioni cross-cutting.
5. Nota in S010 (menu `⋮`) e S120 (tab Interfaccia).

## Verifiche

- ogni valore in `visual.md` è un token di `UX_ARCHITECTURE.md`;
- `ui-behavior.md` non menziona chiamate di rete/SDK;
- `backend-behavior.md` fissa chiave, valori, default `base`, fail-safe, e
  il divieto di inferire `advanced` dal progetto.

## Fine task

- [x] I tre file esistono.
- [x] `UX_ARCHITECTURE.md` cita la convenzione e il fatto che non è una
      12ª schermata.

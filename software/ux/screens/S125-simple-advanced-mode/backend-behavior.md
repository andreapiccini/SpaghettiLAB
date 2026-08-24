# Modalità base / avanzata — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale persistenza parte davvero. Questa preferenza **non** è un comando di
dominio e **non** passa da `ProjectRepository` / `CommandStack` (S014) né da
S122 (backup progetto). È una preferenza della macchina/browser.

## Storage

- Port: `Storage` di `@spaghettilab/domain`, adapter browser
  `LocalStorageAdapter` (`packages/app/src/lib/local-storage-adapter.ts`),
  namespace `spaghettilab:`.
- Chiave logica: `ui.mode` → `localStorage["spaghettilab:ui.mode"]`.
- Valori ammessi: la stringa `base` oppure la stringa `advanced`.
- **Default e fail-safe**: `get()` restituisce `null`, JSON spazzatura, stringa
  vuota, o qualsiasi valore diverso da `advanced` → si tratta come `base`.
  Il primo avvio (chiave assente) è quindi sempre base. **Non** inferire
  `advanced` da Device Profile, Processing Graph, o qualunque altro campo
  del `ProjectV1`.
- **Non** finisce nell'export del progetto, **non** viaggia con ⌘S, **non**
  cambia cambiando progetto. Un export/import su un altro browser parte da
  base finché l'utente non riaccende lo switch lì.

## Lettura all'avvio

1. Al mount della shell (prima del paint della left rail), `Storage.get("ui.mode")`.
2. Parse come sopra. La rail si disegna già filtrata: vietato un frame in
   avanzata se il default è base.
3. Se `get()` fallisce (quota, private mode ostile): restare su `base`, non
   mostrare un banner di errore — la chrome resta usabile.

## Scrittura al toggle

1. Al click, `Storage.set("ui.mode", "advanced" | "base")` **subito**, non in
   debounce, non in coda al salvataggio progetto.
2. Se `set()` fallisce: lo switch resta nello stato che l'utente ha chiesto
   per la sessione corrente (la chrome segue il toggle); al prossimo reload
   si tornerà al valore precedente (o a base se non c'era). Un toast non è
   richiesto: è storage locale, non un deploy.
3. Round-trip obbligatorio: reload della pagina → stesso valore. Verifica
   manuale e test sul parse/store.

## Redirect fuori da una schermata nascosta

Puro stato UI (`navigate("core-connections")`). Nessun `save()`, nessun
comando. Il `CommandStack` e il progetto aperto restano intatti.

## Badge "configurazione avanzata presente"

Lettura **solo** dal `ProjectV1` già in memoria (`CommandStack.current`),
nessuna rete:

- presenza di Device Profile authorati nel progetto (oltre il catalogo
  installato), oppure
- presenza di un System Automation Graph (S111), oppure
- pin/pack OTA nel progetto.

Se nessuno di questi: niente banner. La rilevazione non scrive `ui.mode`.

## Fuori scope (altri task)

- Tab Runtime filtrate: implementazione in UI-S090, contratto visivo qui.
- Tab Settings filtrate e tab Interfaccia: implementazione in UI-S120,
  contratto visivo qui.
- Espansione left rail persistita: già citata in `UX_ARCHITECTURE.md` §
  Shell, chiave distinta, non questo task.

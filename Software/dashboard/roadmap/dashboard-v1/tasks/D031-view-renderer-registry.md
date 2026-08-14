# D031 — Registry ViewRenderer (hook pluggable)

**Stato:** ⬜ TODO
**Dipende da:** D030
**Blocca:** D040, D051 (canvas usa registry)

## Obiettivo

Introdurre nel domain/app un **registro di renderer** così in futuro schematic /
top_down / first_person / pack custom si agganciano **senza riscrivere** il canvas.

Fase 1: un solo renderer registrato — `CardsRenderer`.

## Implementazione richiesta

1. Interfaccia (Dart) tipo:

```text
abstract class ViewRenderer {
  ViewModeKind get kind;
  Widget build(ViewRenderContext ctx);
}
```

`ViewRenderContext`: appearance, layout **oppure** scene, map pointId→value,
callbacks comando.

2. `ViewRendererRegistry.register(renderer)` / `resolve(kind)`.
3. Builtin: `CardsRenderer` (usa `DashboardLayout`).
4. Se `kind != cards` → UI friendly "Vista non disponibile in questa versione"
   (non crash).
5. Documentare in package README come un developer aggiungerà un renderer (fase 2).

## Verifiche

- canvas risolve sempre tramite registry, mai `if (cards) …` sparsi;
- test: registry con fake second renderer stub;
- zero automazioni; zero MQTT.

## Fine task

- [ ] Registry + CardsRenderer.
- [ ] Hook documentato verso `VIEW_MODES.md`.

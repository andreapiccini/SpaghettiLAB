# Roadmap Dashboard — Fase 2 (viste e scene)

[Fase 1](../dashboard-v1/README.md) · [View modes](../../design/VIEW_MODES.md) · [HOST_API](../../HOST_API.md)

Grafica dopo le cards: Scene 2D, renderer builtin, pack che cambiano la vista.
Automazioni restano fuori. Firma store / plugin Dart = D250.

## Task

| Stato | Task | Risultato |
|---|---|---|
| ✅ | [D200 — Scene + editor placement](tasks/D200-scene-model-and-binding-editor.md) | Nodi 2D, bind point, drag in modifica |
| ✅ | [D210 — Renderer schematic](tasks/D210-schematic-renderer.md) | Schema + edges live |
| ✅ | [D220 — Renderer top_down](tasks/D220-top-down-renderer.md) | Pianta serra |
| ✅ | [D230 — first_person stilizzato](tasks/D230-first-person-renderer.md) | Camminata 2.5D builtin |
| ✅ | [D240 — Visual Pack SDK + publish locale](tasks/D240-visual-pack-sdk.md) | JSON + install locale |
| ✅ | D110 — Adapter Protocol V1 | Record decodificati → ExposurePoint |
| ✅ | D120 — EdgeHost MQTT | loopback + Mosquitto locale (`mqtt://` / `ws://`) |
| ✅ | D130 — CloudHost | HOST_API HTTP + `cloud://loopback` |
| ✅ | D250 — Marketplace reale + firma pack | Ed25519; pack **Notte**; niente eval Dart |

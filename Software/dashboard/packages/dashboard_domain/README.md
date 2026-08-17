# dashboard_domain

Dart puro: punti esposti, layout cards, appearance, ViewPreset, Visual Pack, `HostPort`.

**Automazioni fuori** — niente Rule, MQTT, Node-RED, Protocol V1.
**Viste estendibili** — `ViewModeKind` e `Scene` (prodotto: cards / schematic).
I renderer Flutter (`ViewRendererRegistry`) vivono nell'app, non qui:
registrare un nuovo `ViewRenderer` in `createBuiltinRegistry()` senza toccare il domain.

Non importa `package:flutter`. Contratto HTTP: [`HOST_API.md`](../../HOST_API.md) **V1.5**.
SDK pack locale: [`sdk/README.md`](../../sdk/README.md). Store: pack firmati Ed25519 (`installStorePack`).

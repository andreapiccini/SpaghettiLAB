# Node-RED theme tiers

This folder holds one subfolder per Spaghetti LAB branding tier for the
Node-RED editor. `compose.yaml` mounts whichever one `NODE_RED_THEME` (see
`.env.example`) points to, read-only, over `/data/theme` and
`/data/settings.js`. Switching tiers — including going back from `deep` to
`safe` — is just changing that variable and running `docker compose up -d`
again: flows and credentials live in the separate `node-red-data` volume
and are never affected, and nothing needs to be uninstalled or rebuilt.

## `safe/` (default)

Uses only documented, stable surfaces:

- `editorTheme` options from the
  [official configuration docs](https://nodered.org/docs/user-guide/runtime/configuration#editor-themes) —
  page title/favicon/CSS, header logo/link.
- `externalModules.palette.allowInstall: false` (the current, non-deprecated
  runtime setting) so end users can't install/remove palette nodes and
  break the instance, plus hiding the now-inert "Manage palette" menu entry.
- CSS overrides limited to the editor's public `--red-ui-*` custom
  properties (colors, shadows) — no overrides of internal, undocumented
  class names.

This tier is expected to keep working across Node-RED editor updates
without changes, because it only touches the project's public
customization API.

## `deep/`

Same non-negotiables as `safe/` (no forked image, no extra npm packages,
Deploy button colors and canvas drag/zoom behavior left alone), but goes
further for a more "designed", app-like look:

- Everything from `safe/` (palette lock-down, page/header branding).
- CSS overrides on Node-RED's **internal, undocumented** class names —
  `.red-ui-tab`, `.red-ui-palette-node`, `.red-ui-dialog`, `.red-ui-tray-*`,
  `.red-ui-editableList-item`, etc. — for rounded corners, soft elevation
  shadows on dialogs/menus, pill-shaped buttons and search inputs, and a
  slim brand-tinted scrollbar.
- Rounded flow nodes on the canvas, via a CSS override of the SVG `rx`/`ry`
  geometry properties on `rect.red-ui-flow-node` (a modern-browser CSS
  feature; older browsers just keep the stock square corners — it degrades
  safely, it doesn't break).
- One small companion script, `deep.js`, loaded via `editorTheme.page.scripts`.
  It only tags `<body>` with a class and does a one-time fade-in on load —
  it does not call any Node-RED internal API, so there's nothing in it to
  break across versions.

**Trade-off**: because the CSS in this tier targets internal class names
that are not part of Node-RED's public customization API, a future
Node-RED editor update can rename or restructure them and silently stop
some of these rules from applying (visual regression, not a crash — worst
case it just looks like the `safe` tier again). After bumping the
`nodered/node-red` image tag in `compose.yaml`, open the editor with
`NODE_RED_THEME=deep` and compare against this README's description before
relying on it. `safe/` has no such requirement.

## Switching tiers

```sh
# in .env
NODE_RED_THEME=deep   # or: safe
```

```sh
docker compose up -d
```

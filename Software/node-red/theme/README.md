# Node-RED theme tiers

This folder holds one subfolder per Spaghetti LAB branding tier for the
Node-RED editor. `compose.yaml` mounts whichever one `NODE_RED_THEME` (see
`.env.example`) points to, read-only, over `/data/theme` and
`/data/settings.js`. Switching tiers is just changing that variable and
running `docker compose up -d` again — flows and credentials live in the
separate `node-red-data` volume and are never affected.

## `safe/` (current default)

Uses only documented, stable surfaces:

- `editorTheme` options from the
  [official configuration docs](https://nodered.org/docs/user-guide/runtime/configuration#editor-themes) —
  page title/favicon/CSS, header logo/link, `palette.editable: false` (end
  users can't install/remove nodes and break the instance), and hiding the
  now-inert "Manage palette" menu entry.
- CSS overrides limited to the editor's public `--red-ui-*` custom
  properties (colors, shadows) — no overrides of internal, undocumented
  class names.

This tier is expected to keep working across Node-RED editor updates
without changes, because it only touches the project's public
customization API.

## Future tiers

A deeper visual tier (custom node shapes, simplified/curated palette
layout, a small editor plugin for things CSS can't reach) may be added
later as a sibling folder, e.g. `deep/`. It would go further than the
official `editorTheme` surface and rely on some undocumented internal
structure, so it would need re-checking after Node-RED editor updates —
unlike `safe/`. It does not exist yet.

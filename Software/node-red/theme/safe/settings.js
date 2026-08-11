// Spaghetti LAB branding layer for Node-RED — "safe" tier.
//
// This file does not redefine Node-RED's configuration: it loads the
// official image's own default settings.js (same file the runtime would
// otherwise auto-generate into /data on first boot) and overrides only the
// `editorTheme` section with Spaghetti LAB colors, font, logo, and a couple
// of curation tweaks aimed at non-developer end users. Every other setting
// (flowFile, credentialSecret, uiPort, functionGlobalContext, logging, ...)
// keeps behaving exactly like a stock Node-RED install.
//
// Everything here uses documented `editorTheme` options only — no
// undocumented internal selectors or DOM hacks. See:
// https://nodered.org/docs/user-guide/runtime/configuration#editor-themes
"use strict";

const defaultSettings = require("/usr/src/node-red/node_modules/node-red/settings.js");

// Developer escape hatch: set NODE_RED_ADMIN_MODE=true in .env to
// temporarily re-enable the palette manager (install/remove nodes) for
// yourself. Defaults to false, which is the locked-down, end-user-safe
// behavior this tier exists for. Flip it back to false/remove it when
// you're done installing whatever you needed.
const ADMIN_MODE = String(process.env.NODE_RED_ADMIN_MODE).toLowerCase() === "true";

module.exports = {
  ...defaultSettings,
  // Non-developer end users should not be able to install/remove nodes from
  // the palette (it requires npm access and can break the instance with an
  // incompatible package). This is the runtime-side switch that actually
  // enforces it (editorTheme.palette.editable is the older, deprecated way
  // to do the same thing).
  externalModules: {
    ...defaultSettings.externalModules,
    palette: {
      ...defaultSettings.externalModules?.palette,
      allowInstall: ADMIN_MODE,
    },
  },
  editorTheme: {
    ...defaultSettings.editorTheme,
    page: {
      title: "Spaghetti LAB — Node-RED",
      favicon: "/data/theme/favicon.ico",
      css: "/data/theme/custom.css",
    },
    header: {
      title: "Spaghetti LAB",
      image: "/data/theme/header-icon.png",
      url: "https://spaghetti-lab.my.canva.site",
    },
    logout: {
      redirect: "https://spaghetti-lab.my.canva.site",
    },
    // "Manage palette" is a dead link when palette installs are disabled
    // above, so it's hidden along with them — and shown again in admin mode.
    menu: {
      "menu-item-edit-palette": ADMIN_MODE,
    },
  },
};

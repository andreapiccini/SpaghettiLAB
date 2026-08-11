// Spaghetti LAB branding layer for Node-RED — "deep" tier.
//
// Same approach as theme/safe/settings.js (require() the official default
// settings.js and override only editorTheme + externalModules.palette), but
// this tier also loads a small companion script (deep.js) via
// editorTheme.page.scripts. Everything else — flowFile, credentialSecret,
// uiPort, logging, functionGlobalContext, and so on — behaves exactly like
// a stock Node-RED install, same as the safe tier.
//
// Unlike the safe tier, custom.css here also styles undocumented internal
// class names (red-ui-tab, red-ui-palette-node, red-ui-dialog, the flow
// node SVG shapes, ...) to get a much more "designed" look. Those class
// names are not part of Node-RED's public API and can change between
// editor releases — see theme/README.md before upgrading the image.
"use strict";

const defaultSettings = require("/usr/src/node-red/node_modules/node-red/settings.js");

// Developer escape hatch: set NODE_RED_ADMIN_MODE=true in .env to
// temporarily re-enable the palette manager for yourself. See
// theme/safe/settings.js for the full explanation.
const ADMIN_MODE = String(process.env.NODE_RED_ADMIN_MODE).toLowerCase() === "true";

module.exports = {
  ...defaultSettings,
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
      scripts: "/data/theme/deep.js",
    },
    header: {
      title: "Spaghetti LAB",
      image: "/data/theme/header-icon.png",
      url: "https://spaghetti-lab.my.canva.site",
    },
    logout: {
      redirect: "https://spaghetti-lab.my.canva.site",
    },
    menu: {
      "menu-item-edit-palette": ADMIN_MODE,
    },
  },
};

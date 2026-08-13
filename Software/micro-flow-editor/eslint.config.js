import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist",
      "**/coverage",
      "**/node_modules",
      // Real Node-RED node registration files (S112) — plain JS following Node-RED's
      // own runtime conventions (e.g. `const node = this;` inside a node constructor
      // is the documented pattern, not a lint violation), not part of the typed
      // src/ codebase these rules are tuned for.
      "packages/node-red-nodes/node-red/**",
      // Generated bundle output (S112B) — build artifact, not source.
      "packages/node-red-nodes/dist-node-red/**",
      // Node.js build script (S112B) — plain JS, not part of the typed src/ codebase.
      "packages/node-red-nodes/scripts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["packages/app/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["packages/domain/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);

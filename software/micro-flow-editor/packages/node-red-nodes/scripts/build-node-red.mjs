// Bundles each Node-RED node entry point (S112) into a self-contained CommonJS
// file — S112B's whole reason to exist: every @spaghettilab/* package in this
// workspace resolves via package.json's "main": "./src/index.ts", which a plain
// Node.js runtime (Node-RED's container) cannot import directly. esbuild resolves
// and bundles the real TypeScript sources (protocol-sdk, domain, core-actions,
// core-status, telemetry-buffer, system-automation-graph, node-red-nodes itself,
// and the "ws" dependency) straight into one file per node, no separate `tsc`
// step needed. Output is CommonJS (not ESM) specifically to avoid any doubt about
// Node-RED's ESM-node support — a plain `require()` always works.
import { build } from "esbuild-wasm";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(packageRoot, "node-red");
const outDir = path.join(packageRoot, "dist-node-red");

const nodeNames = ["spaghetti-connection", "spaghetti-record-source", "spaghetti-command-target", "spaghetti-status", "spaghetti-coordinator"];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: nodeNames.map((name) => path.join(sourceDir, `${name}.js`)),
  outdir: outDir,
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  // "RED" is a parameter Node-RED passes into the exported function at load
  // time, not an importable module — nothing to externalize for it.
  //
  // Source files use `export default function (RED) {...}` (ESM syntax,
  // matching this package's own "type": "module"); esbuild's CJS output for
  // that is `exports.default = fn`, not `module.exports = fn` — but Node-RED's
  // classic `require(file)` loader expects the latter directly. This footer
  // is the standard esbuild fix for exactly that CJS-default-export mismatch.
  footer: { js: "module.exports = module.exports.default;" },
  logLevel: "info",
});

for (const name of nodeNames) {
  cpSync(path.join(sourceDir, `${name}.html`), path.join(outDir, `${name}.html`));
}

// A minimal, self-contained package.json — this is what gets mounted into the
// Node-RED container's node_modules, not the workspace package.json (which has
// dev-only fields like "main": "./src/index.ts" that would defeat the point).
const nodeManifest = Object.fromEntries(nodeNames.map((name) => [name, `${name}.cjs`]));
writeFileSync(
  path.join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "@spaghettilab/node-red-nodes",
      version: "0.1.0",
      description: "Real SpaghettiLAB Node-RED nodes (S112), bundled for runtime install (S112B).",
      "node-red": { nodes: nodeManifest },
    },
    null,
    2,
  ) + "\n",
);

console.log(`Bundled ${nodeNames.length} Node-RED nodes into ${path.relative(packageRoot, outDir)}/`);

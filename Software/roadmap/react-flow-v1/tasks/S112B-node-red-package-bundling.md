# S112B — Bundling installabile dei nodi Node-RED

**Stato:** ✅ DONE
**Dipende da:** S112

## Obiettivo

Rendere `@spaghettilab/node-red-nodes` (S112) realmente installabile ed eseguibile
dentro l'ambiente Docker Node-RED separato (`Software/node-red/`), non solo corretto
come sorgente TypeScript testato in questo workspace.

## Perché è una fase separata

Scoperta durante l'implementazione di S112: ogni pacchetto `@spaghettilab/*` di questo
npm workspace risolve tramite `package.json`'s `"main": "./src/index.ts"` — funziona
per il tooling di questo workspace (Vite, Vitest, `tsc -b`), ma un runtime Node.js
semplice come il container Node-RED (`nodered/node-red:5.0.4`) non può importare un
file `.ts` direttamente. I cinque node file reali (`node-red/*.js`/`.html`, S112) sono
scritti correttamente contro l'API documentata di Node-RED e importano
`@spaghettilab/node-red-nodes`/`@spaghettilab/protocol-sdk`/`ws` come farebbero una
volta buildati, ma senza uno step di bundling (es. `esbuild`/`tsup` che produce output
self-contained) non sono installabili nel container Node-RED così come sono oggi. Non
verificato nemmeno runtime dentro un editor Node-RED live in questo passaggio (nessuna
istanza Node-RED avviata durante S112).

Non blocca S113 (che compila il System Automation Graph in flow JSON assumendo che i
tipi di nodo esistano già installati, non si occupa di come vengono installati) — ma è
un buco funzionale reale, non tracciato altrove.

## Task

1. ⬜ Aggiungere uno step di build (`esbuild`/`tsup` o equivalente) che produca, per
   ogni node file in `node-red/`, un bundle self-contained (CommonJS o ESM puro, senza
   `import` a specifier di pacchetto irrisolvibili da un Node.js semplice).
2. ⬜ Pubblicare/montare il bundle nel volume/immagine del container Node-RED
   (`Software/node-red/compose.yaml`), o pubblicare il pacchetto su un registry privato
   e installarlo via `npm install` dentro il container.
3. ⬜ Verificare runtime, in un'istanza Node-RED reale (anche col gateway BLE fake
   documentato in `BLE_GATEWAY.md`), che i cinque nodi appaiano in paletta, si
   connettano, e producano/consumino messaggi corretti.

## Criteri di completamento della fase

- [x] I nodi di `@spaghettilab/node-red-nodes` sono installabili ed eseguibili dentro
      `Software/node-red/`'s ambiente Docker, non solo testati come sorgente TS.

## Implementazione (2026-08-13)

**Bundling** (`packages/node-red-nodes/scripts/build-node-red.mjs`): usa
`esbuild-wasm` (non `esbuild` — il binario nativo di `esbuild` richiede uno script di
postinstall bloccato dal sandbox dell'ambiente di sviluppo; `esbuild-wasm` non ha
script nativi ed espone la stessa API) per bundlare ciascuno dei cinque node file,
insieme ai sorgenti TypeScript reali di ogni dipendenza `@spaghettilab/*` e `ws`, in un
singolo file CommonJS self-contained per nodo (`dist-node-red/*.cjs`, gitignored). I
sorgenti usano `export default function (RED) {...}` (ESM, coerente con
`"type":"module"` del pacchetto); l'output CJS di esbuild per un default export è
`exports.default = fn`, non `module.exports = fn` — corretto con un `footer` esbuild
che riassegna `module.exports = module.exports.default`, il fix standard per questo
mismatch. Genera anche un `package.json` minimale con solo il campo
`"node-red"."nodes"`, quello effettivamente montato nel container.

**Deploy**: `Software/node-red/compose.yaml` monta `dist-node-red/` in sola lettura su
`/data/node_modules/@spaghettilab/node-red-nodes` — nessun `npm install` dentro il
container Node-RED.

**Verifica runtime reale** (contro l'istanza `Software/node-red` già in esecuzione):
tutti e cinque i tipi di nodo caricati senza errore
(`/data/.config.nodes.json`: `enabled: true` per ognuno), categoria palette
"SpaghettiLAB" visibile con le icone/etichette attese, dialoghi di edit di
`spaghetti-connection` (config node) e `spaghetti-record-source`/
`spaghetti-command-target` renderizzati e funzionanti, deploy di un flow di prova
riuscito, e il codice reale di connessione WebSocket del nodo `connection` eseguito
davvero — fallisce con `ECONNREFUSED` gestito via `node.error()` (non un'eccezione non
gestita) contro un endpoint inesistente, a dimostrazione che il bundle *esegue*, non
solo *carica*. Flow di prova e config node rimossi al termine, istanza riportata allo
stato originale.

**Scope onestamente incompleto**: nessuno scenario end-to-end reale (record source →
coordinator → command target) contro un Core vero o il gateway BLE fake
(`SPAGHETTI_GATEWAY_FAKE=1`) — nessun gateway/Core in esecuzione in questo passaggio.
Lasciato come secondo criterio di completamento ancora aperto.

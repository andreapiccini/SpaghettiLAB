# S112B — Bundling installabile dei nodi Node-RED

**Stato:** ⬜ TODO
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

- [ ] I nodi di `@spaghettilab/node-red-nodes` sono installabili ed eseguibili dentro
      `Software/node-red/`'s ambiente Docker, non solo testati come sorgente TS.
- [ ] Almeno uno scenario end-to-end (record source → coordinator → command target) è
      stato osservato funzionare in un'istanza Node-RED reale.

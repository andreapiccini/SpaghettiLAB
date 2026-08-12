# S110 — Automazioni cross-Core con Node-RED

**Stato:** ⬜ TODO
**Dipende da:** S040, S080, S090

## Obiettivo

Collegare record e comandi appartenenti a Core differenti attraverso Node-RED senza
inserire tali edge nel Config firmware.

## Implementazione richiesta

1. Definisci System Automation Graph con endpoint `Core record field`, `Core command`,
   Node-RED processing/integration e stato connection; usa device ID + stable key +
   schema/field/command, mai runtime ID.
2. Implementa catalogo unificato dei Core disponibili e compatibility engine per tipi,
   unità e comando. Un link temperatura→display deve dichiarare trasformazione quando
   gli schemi differiscono.
3. Implementa package di nodi Node-RED SpaghettiLAB necessario: connection/config,
   record source, command target, status e coordinator; riusa lo stesso SDK Protocol.
4. Compila il System Automation Graph in flow Node-RED deterministico con owner/project
   metadata e stable node IDs. Credenziali sono riferite, non esportate.
5. Implementa adapter Node-RED Admin API con autenticazione, get revision, validate,
   diff e deploy. Riconcilia soltanto tab/subflow/nodi posseduti dal progetto e conserva
   flow utente estranei.
6. Gestisci Core offline, reconnect, schema/catalog change, boot ID, backpressure,
   command result e retry senza duplicare azioni.
7. Permetti import dello stato gestito Node-RED e classifica IN_SYNC/DIVERGED come per
   Config; niente deploy automatico al reconnect.
8. Fornisci runtime status del collegamento end-to-end e diagnostica dal record source
   al command target.

## Verifiche

- temperatura del Core A raggiunge display/comando del Core B;
- broker/Node-RED/Core offline non ferma i runtime locali;
- deploy conserva flow Node-RED non posseduti;
- revisione concorrente produce conflict e non sovrascrive;
- record duplicato/retry non duplica command quando correlation/replay lo impediscono;
- catalog change rende link stale finché rivalidato.

## Fine task

- [ ] Ogni edge cross-Core viene eseguito da Node-RED, non dal Config locale.
- [ ] Deploy Node-RED è revisionato, scoped e reversibile.
- [ ] Custom nodes condividono SDK e semantica firmware.
- [ ] Stato e guasti del percorso end-to-end sono osservabili.


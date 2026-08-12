# S113 — Compiler, Admin API deploy e diagnostica runtime

**Stato:** ⬜ TODO
**Dipende da:** S112

## Obiettivo

Portare il System Automation Graph autore fino a un deploy Node-RED reale, revisionato
e reversibile, e renderne osservabile lo stato end-to-end.

## Implementazione richiesta

1. Compila il System Automation Graph in flow Node-RED deterministico con owner/project
   metadata e stable node IDs. Credenziali sono riferite, non esportate.
2. Implementa adapter Node-RED Admin API con autenticazione, get revision, validate,
   diff e deploy. Riconcilia soltanto tab/subflow/nodi posseduti dal progetto e conserva
   flow utente estranei.
3. Gestisci Core offline, reconnect, schema/catalog change, boot ID, backpressure,
   command result e retry senza duplicare azioni.
4. Permetti import dello stato gestito Node-RED e classifica IN_SYNC/DIVERGED come per
   Config; niente deploy automatico al reconnect.
5. Fornisci runtime status del collegamento end-to-end e diagnostica dal record source
   al command target.

## Verifiche

- la temperatura del Core A raggiunge display/comando del Core B end-to-end;
- broker, Node-RED o Core offline non fermano i runtime locali degli altri componenti;
- un deploy conserva i flow Node-RED non posseduti dal progetto;
- una revisione concorrente produce conflict e non sovrascrive silenziosamente;
- un record duplicato/retry non duplica il comando corrispondente.

## Fine task

- [ ] Ogni edge cross-Core viene eseguito da Node-RED, non dal Config locale.
- [ ] Il deploy Node-RED è revisionato, scoped e reversibile.
- [ ] Stato e guasti del percorso end-to-end sono osservabili.

# S092 — Command runner e discovery

**Stato:** ⬜ TODO
**Dipende da:** S091

## Obiettivo

Permettere azioni immediate ed esplorazione del Core, tenendole nettamente separate
dalla modifica del Config persistente.

## Implementazione richiesta

1. Implementa command runner catalog-driven con form tipizzato, permission check,
   correlation/result e distinzione chiara da una modifica Config.
2. Implementa discovery scan/list/accept/reject, policy invasive, job progress e
   integrazione con Physical Composition (S050).

## Verifiche

- l'esecuzione di un comando manuale non modifica Config o progetto;
- una scan invasiva richiede l'autorizzazione esplicita prevista dalla policy;
- permission denied, queue full e job timeout sono rappresentati con esito distinto,
  non genericamente come "errore".

## Fine task

- [ ] Comandi manuali e Config restano visibilmente distinti in ogni schermata/log.
- [ ] Discovery copre scan, accept, reject e stato di avanzamento del job.

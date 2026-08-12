# S094 — Operazioni amministrative autorizzate

**Stato:** ⬜ TODO
**Dipende da:** S092

## Obiettivo

Esporre le operazioni amministrative sensibili del Core con conferme e permessi
adeguati alla loro natura distruttiva/irreversibile.

## Implementazione richiesta

1. Implementa operazioni autorizzate per connectivity policy, lease, maintenance,
   credential/provisioning e reset scope con conferme per mutazioni distruttive.

## Verifiche

- ogni operazione distruttiva richiede conferma esplicita con target visibile prima
  di eseguire;
- un permesso mancante impedisce l'operazione lato app, non solo lato firmware.

## Fine task

- [ ] Le operazioni amministrative hanno confini netti rispetto a comandi e Config.
- [ ] Ogni mutazione distruttiva richiede conferma esplicita con target visibile.

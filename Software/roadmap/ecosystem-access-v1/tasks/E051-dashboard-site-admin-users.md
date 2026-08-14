# E051 — Dashboard site admin (utenti)

**Stato:** ⬜ TODO
**Dipende da:** E050, E020

## Obiettivo

`site_admin` gestisce inviti utenti base/operator e vede stato site.

## Implementazione richiesta

1. Schermata settings → tab **Utenti** (solo site_admin+).
2. Invito email/link; ruolo viewer | operator.
3. Revoca accesso; lista sessioni attive (read-only).
4. Link "Richiedi supporto SpaghettiLAB" → avvia flow E080 (placeholder).

## Verifiche

- site_admin non può creare integrator senza policy
- audit su invite/revoke

## Fine task

- [ ] UI + host endpoints inviti.
- [ ] Spec UX tab utenti.

# E090 — Threat model & audit gate

**Stato:** ⬜ TODO
**Dipende da:** E021, E060, E080, E071

## Obiettivo

Chiudere roadmap access: sicurezza, audit, scenari turnkey on-prem.

## Checklist

- [ ] Nessun servizio admin (Node-RED, host debug) su 0.0.0.0 senza auth in profile turnkey
- [ ] Support Grant: test deny without approve; test expiry
- [ ] Ruoli: viewer cannot command / cannot edit appearance (host enforced)
- [ ] Site Package apply auditato
- [ ] Segreti solo credential store; export/audit redacted (allineamento S121/S123)
- [ ] Documento threat: partner compromise, stolen laptop, revoked grant

## Fine task

- [ ] Gate datato; roadmap E010–E090 ✅ dove applicabile.

# D250 — Marketplace reale + firma pack

**Stato:** ✅ DONE (2026-08-17)
**Dipende da:** D240, D130

Store Visual Pack **firmati Ed25519**. JSON + renderer builtin. Nessun eval Dart,
nessun pagamento, nessun plugin remoto.

## Risultato

- `HostPort.installStorePack` / `POST /v1/marketplace/visual-packs/{packId}/install`
- Catalogo demo **Notte**: Installa (verifica firma) → Applica
- SDK locale (`installLocalPack`) resta senza firma
- Tamper del JSON → `PackSignatureException` / install rifiutata

# S030 — Sessioni Core e sincronizzazione

**Stato:** ⬜ TODO
**Dipende da:** S024

## Obiettivo

Gestire simultaneamente più Core, distinguendo connessione, stato live e relazione con
il progetto senza scritture implicite.

## Implementazione richiesta

1. Crea inventory persistente di Core binding con expected device ID e connection
   profile; discovery di rete/BLE può proporre binding ma non sostituire identità.
2. Implementa state machine `DISCONNECTED→CONNECTING→AUTHENTICATING→SYNCHRONIZING→READY`
   e sottostati validate/apply/update/reboot/trial/error.
3. Alla sincronizzazione leggi identity, status, capability, features, catalogo,
   topologia, Config revision/hash e resources in ordine coerente.
4. Implementa cache catalogo indicizzata da device ID + fingerprint; invalida tutto
   dopo OTA o fingerprint diverso.
5. Classifica relazione progetto/device come `IN_SYNC`, `PROJECT_DIRTY`,
   `DEVICE_CHANGED`, `DIVERGED` o `INCOMPATIBLE` usando DeploymentRecord.
6. Fornisci operazioni esplicite per importare stato live, mantenere progetto o avviare
   riconciliazione; mai auto-apply al reconnect.
7. Gestisci disconnessione, backoff, cambio boot ID, transport fallback autorizzato e
   session cancellation senza perdere modifiche locali.
8. Isola errori di un Core: gli altri workspace restano operativi.

## Verifiche

- due Core con stesso catalogo ma device ID distinti non condividono Config/cache;
- modifica esterna del Config produce `DEVICE_CHANGED`/`DIVERGED`;
- reconnect e reboot invalidano soltanto stato effimero necessario;
- fingerprint a metà paginazione non pubblica catalogo parziale;
- Core offline resta editabile con ultimo snapshot marcato stale.

## Fine task

- [ ] Multi-Core e lifecycle sessione sono completi.
- [ ] Sync non muta automaticamente dispositivo o progetto.
- [ ] Stato stale, conflitto e incompatibilità sono distinguibili.
- [ ] Cache e reconnect rispettano boot ID e fingerprint.


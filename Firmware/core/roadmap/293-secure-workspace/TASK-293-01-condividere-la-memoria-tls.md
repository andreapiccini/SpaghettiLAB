# TASK-293-01 — Condividere la memoria TLS

**Stato:** ⬜ TODO
**Fase:** 293 — Workspace sicuro condiviso

## Cosa devo fare

Prima di cambiare configurazioni, ispeziona la Zephyr 4.4 realmente usata dalla build e
registra in `verification/resources/TLS_ALLOCATOR.md` quale allocator usa mbedTLS con e
senza `CONFIG_MBEDTLS_ENABLE_HEAP`. Non assumere che disabilitare i 60 KiB elimini il
picco TLS.

Crea `include/spaghetti/secure_workspace.h`,
`subsys/services/secure_workspace/secure_workspace.c` e `tests/secure_workspace/`:

```c
enum spaghetti_secure_workspace_owner {
	SPAGHETTI_SECURE_OWNER_NONE,
	SPAGHETTI_SECURE_OWNER_MQTT,
	SPAGHETTI_SECURE_OWNER_WIFI_OTA,
	SPAGHETTI_SECURE_OWNER_REMOTE_CONSOLE,
};

struct spaghetti_secure_workspace_snapshot {
	enum spaghetti_secure_workspace_owner owner;
	size_t capacity;
	size_t peak_used;
	uint32_t allocation_failures;
};

int spaghetti_secure_workspace_init(void);
int spaghetti_secure_workspace_acquire(
	enum spaghetti_secure_workspace_owner owner, k_timeout_t timeout);
int spaghetti_secure_workspace_release(
	enum spaghetti_secure_workspace_owner owner);
int spaghetti_secure_workspace_get_snapshot(
	struct spaghetti_secure_workspace_snapshot *out);
```

L'owner è passato per valore; `release()` rifiuta un owner differente con `-EPERM`.
`timeout` è bounded e l'acquisizione è consentita solo da thread context. Sul profilo
Minimal esiste un solo owner pesante; Standard/Extended possono aumentare il limite
solo tramite Kconfig. MQTT deve rilasciare connessione e workspace prima di OTA Wi-Fi.

Sostituisci la heap mbedTLS privata con l'allocator generale Zephyr configurato per
profilo e misurato con il vero handshake. Il workspace controlla l'ammissione; non
restituisce puntatori ai servizi e non diventa un allocator alternativo. Riduci la
capacità solo dopo aver misurato picco e margine nei test indicati sotto.

## Perché è fatto così

La memoria TLS serve durante handshake e record cifrati, ma una heap privata rimane
inutilizzabile dagli altri servizi. Condividere l'allocator recupera flessibilità;
l'admission control impedisce che MQTT e OTA raggiungano insieme un picco impossibile.

## Come si usa

```c
int rc = spaghetti_secure_workspace_acquire(
	SPAGHETTI_SECURE_OWNER_WIFI_OTA, K_SECONDS(5));
if (rc == 0) {
	/* Apri e usa la sessione DTLS. */
	(void)spaghetti_secure_workspace_release(
		SPAGHETTI_SECURE_OWNER_WIFI_OTA);
}
```

## Checklist di completamento

- [ ] Allocator Zephyr 4.4 effettivo è documentato.
- [ ] Arena privata da 60 KiB è rimossa senza rimuovere TLS/DTLS.
- [ ] Minimal ammette una sola sessione pesante.
- [ ] Peak e failure count sono osservabili.
- [ ] Errori di memoria non alterano Config o immagine confermata.

## Verifica e fine task

Esegui test con credenziale corretta/errata, 100 handshake, disconnessione durante
handshake, MQTT→OTA, timeout e allocazione forzatamente fallita:

```sh
make validate
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/secure_workspace -T tests/remote_console -T tests/ota \
  -p native_sim/native/64 --inline-logs --clobber-output'
make pristine
```

Il task termina solo con assenza di leak e una nuova misura RAM registrata.

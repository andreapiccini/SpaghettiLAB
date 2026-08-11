# Optional shared-resource coordination

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

Power coordinates a physical resource shared by multiple live Modules. It performs
first-acquire activation and final-release deactivation; it is not Zephyr system power
management, sleep policy, or battery management.

## Current hardware status

Spaghetti LAB Core V1 does not declare a verified controllable rail. Its Port describes
only the I2C controller on GPIO3/GPIO4. Consequently:

- `CONFIG_SPAGHETTI_POWER` defaults to `n` in production;
- no speculative `power-gpios`, pin number, or polarity is present;
- Module Manager does not acquire a fictional resource;
- `CONFIG_SPAGHETTI_POWER_FAKE_BACKEND` exists only for `tests/power`.

A future Core may enable this component after its schematic, safe state and electrical
behaviour have been verified.

## Ownership model

`spaghetti_power_resource_id_t` identifies the physical shared resource.
`spaghetti_power_owner_id_t` identifies one live Module. Owner identity is deliberately
not a Port ID: INA219 Modules at `0x40` and `0x41` on the same Port must hold two
independent references.

Power owns a fixed table of eight owners per resource and a `k_mutex`; it allocates no
heap memory. The public `spaghetti_power_status` is a caller-owned snapshot containing
state, reference count and last transition error.

## API

```c
int spaghetti_power_init(void);
int spaghetti_power_acquire(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner);
int spaghetti_power_release(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner);
int spaghetti_power_get_status(spaghetti_power_resource_id_t id,
			       struct spaghetti_power_status *out);
```

The first successful acquire invokes the ON backend. Intermediate owners only change
the table and count. The final release invokes OFF. Ownership is committed only after
ON succeeds and retained if OFF fails, so the caller can retry without corrupting the
accounting.

The API is thread-safe and thread-only because it uses a mutex and may call hardware.
It must not be called from an ISR.

## Lifecycle

```mermaid
sequenceDiagram
    participant A as Module A
    participant B as Module B
    participant P as Power resource
    participant H as Verified backend
    A->>P: acquire(resource, module_a_id)
    P->>H: ON (count 0 to 1)
    B->>P: acquire(resource, module_b_id)
    Note over P: count 2; no hardware transition
    A->>P: release(resource, module_a_id)
    Note over P: count 1; remains ON
    B->>P: release(resource, module_b_id)
    P->>H: OFF (final owner)
```

## Files and verification

| File | Role |
|---|---|
| `include/spaghetti/power.h` | Public types, states and API contract. |
| `subsys/power/power.c` | Deterministic owner table and transition logic. |
| `subsys/power/power_internal.h` | Private fake-backend seam. |
| `tests/power/` | Native fake tests for ownership, limits and rollback. |

Run:

```sh
docker compose run --rm --entrypoint sh dev -lc \
  'west twister -T tests/power -p native_sim/native/64 --inline-logs --clobber-output'
```

When a future board adds a real resource, its Devicetree must contain the verified
controller, pin and polarity. Only then should a real backend replace the test seam and
Module Manager acquire before driver init and release after deinit or rollback.

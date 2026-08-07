# Port

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Port represents one physical Spaghetti connector while hiding the board-specific
controller, pin routing, and optional power/presence hardware beneath it.

## Responsibility

- Own runtime Port objects and their static descriptors.
- Enumerate ports generated from Devicetree and expose capabilities.
- Validate underlying Zephyr devices and coordinate shared access.

## Non-responsibility

- Never identify a connected module or implement its protocol.
- Never store `Port 0 = SHT40` in static state.
- Never expose MCU-specific conditionals to higher layers.

## Files

- Public API: `include/spaghetti/port.h`; opaque handles, IDs, capabilities.
- Implementation: `subsys/port/port.c`; Devicetree translation, Zephyr device
  references, locks, and private Port state.

## Data structures to implement

- `spaghetti_port_id`: stable logical identifier; value semantics.
- `spaghetti_port_capabilities`: immutable flags/parameters created from DT,
  owned by Port, read by Manager/Discovery/drivers.
- `spaghetti_port`: created at boot, owned and modified by Port for firmware
  lifetime; other layers receive an opaque or const reference.
- `spaghetti_port_state`: available/claimed/fault where each state is needed.

## Functions to implement

### `spaghetti_port_init_all()`

- **Purpose:** create the runtime catalog from static board data.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** generated Devicetree description.
- **Outputs:** status and populated catalog.
- **State modified:** all Port-owned objects.
- **Failure cases:** malformed descriptor, required controller not ready.
- **Called next:** Zephyr `device_is_ready` and GPIO/I2C/SPI setup by DIRECT CALL.

### `spaghetti_port_get()` / `spaghetti_port_count()`

- **Purpose:** enumerate or retrieve a stable Port handle.
- **Called by:** Core, Manager, Discovery, diagnostics.
- **Trigger/mechanism/context:** lookup; DIRECT CALL; caller thread.
- **Inputs:** port ID/index.
- **Outputs:** read-only handle/count or not-found error.
- **State modified:** none.
- **Failure cases:** invalid ID or subsystem not initialized.
- **Called next:** none.

### `spaghetti_port_get_capabilities()`

- **Purpose:** let policy verify compatibility without knowing the board.
- **Called by:** Module Manager, Discovery provider, Communication.
- **Trigger/mechanism/context:** configuration/probe; DIRECT CALL; caller thread.
- **Inputs:** Port handle.
- **Outputs:** immutable capability snapshot.
- **State modified:** none.
- **Failure cases:** stale/invalid handle.
- **Called next:** none.

### `spaghetti_port_acquire()` / `spaghetti_port_release()`

- **Purpose:** serialize ownership when a physical resource cannot be shared.
- **Called by:** Module Manager or driver through the agreed Port contract.
- **Trigger/mechanism/context:** lifecycle/transaction; DIRECT CALL; thread only.
- **Inputs:** Port handle, owner token, bounded timeout.
- **Outputs:** acquisition status.
- **State modified:** owner/lock state.
- **Failure cases:** busy, timeout, wrong owner on release.
- **Called next:** `k_mutex_lock/unlock` if a mutex is selected.

## Interaction diagram

```text
Core --DIRECT CALL--> Port init --DIRECT CALL--> Zephyr Device Model
Manager/driver --DIRECT CALL--> Port API --DIRECT CALL--> I2C/GPIO/SPI
```

## State / lifecycle

```text
UNINITIALIZED -> AVAILABLE <-> CLAIMED
                       +----> FAULT
```

## Concurrency considerations

Lookups should remain non-blocking. Protect only mutable claim/bus state, using a
mutex in thread context. ISR access is not part of the initial contract. Shared
I2C serialization may already occur in the controller driver, but Port ownership
and multi-step transactions can still require a higher-level lock: DECISION
REQUIRED after real transaction boundaries are known.

## Zephyr concepts involved

- Devicetree is compiled static hardware description.
- Device Model supplies initialized controller objects.
- DT spec structures bind controllers and GPIOs without hard-coded pin numbers.
- Mutex suspends a contending thread; it must not be used from ISR.

## Implementation steps

1. Define ID and minimum capability enum.
2. Define opaque runtime object and descriptor.
3. Implement static lookup with fake descriptors.
4. Define/validate the future Port DT binding.
5. Obtain and validate one real controller.
6. Add locking only for a demonstrated shared resource.

## Expected result

The firmware enumerates physical ports and reports capabilities identically on
different boards, despite different underlying mappings.

## Minimal test

Enumerate one port; verify valid lookup, invalid lookup, and expected capability.

## Dependencies

Board/Devicetree description and relevant Zephyr peripheral drivers.

## Not yet

No module identity, universal bus API, EEPROM discovery, or actual board pins.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_port_init_all` | Core | boot | DIRECT CALL | main thread | Device Model/peripheral setup |
| `spaghetti_port_get` | Manager/Discovery | lookup | DIRECT CALL | caller thread | none |
| `spaghetti_port_count` | Core/Communication | query | DIRECT CALL | caller thread | none |
| `spaghetti_port_get_capabilities` | Manager/driver | compatibility check | DIRECT CALL | caller thread | none |
| `spaghetti_port_acquire` | Manager/driver | operation | DIRECT CALL | caller thread | optional mutex |
| `spaghetti_port_release` | Manager/driver | operation complete | DIRECT CALL | caller thread | optional mutex |

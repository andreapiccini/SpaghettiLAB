# Discovery

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md) · [Roadmap](../../IMPLEMENTATION_ROADMAP.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Discovery answers or receives the answer to “which module is connected to this
port?” independently from module lifecycle management.

## Responsibility

- Normalize identification proposals from interchangeable providers.
- Apply MANUAL/AUTO/HYBRID policy without equating AUTO with EEPROM.
- Track source, validity, confidence, and generation of a result.

## Non-responsibility

No module allocation, driver lookup, hardware lifecycle, or persistent storage
implementation. A provider may probe; Discovery remains provider-independent.

## Files

- Public API: `include/spaghetti/discovery.h`; provider/result/policy contracts.
- Implementation: `subsys/discovery/discovery.c`; provider coordination/policy.

## Data structures to implement

- `spaghetti_discovery_result`: value object created by provider/Discovery,
  transferred to Manager, containing port, type, source, confidence/generation.
- `spaghetti_discovery_provider`: immutable operation descriptor owned by its
  provider; Registry-like lifetime.
- `spaghetti_discovery_policy`: owned and modified by Discovery from validated
  Config; read by Communication.
- per-port discovery state: owned solely by Discovery.

## Functions to implement

### `spaghetti_discovery_init()`

- **Purpose:** initialize policy/provider catalog and per-port state.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** validated policy and available providers.
- **Outputs:** status.
- **State modified:** Discovery-owned state.
- **Failure cases:** invalid mode/provider configuration.
- **Called next:** provider init by DIRECT CALL if required.

### `spaghetti_discovery_submit_manual()`

- **Purpose:** normalize an authoritative external assignment.
- **Called by:** Communication or Config reconciliation.
- **Trigger:** backend/frontend command or restored config.
- **Invocation mechanism:** COMMUNICATION RX followed by DIRECT CALL.
- **Execution context:** communication worker/caller thread; never ISR.
- **Inputs:** port ID, module type, revision.
- **Outputs:** validation/application status.
- **State modified:** latest result for that port.
- **Failure cases:** invalid port/type, stale revision, policy rejects manual input.
- **Called next:** Module Manager configure by DIRECT CALL initially.

### `spaghetti_discovery_run()`

- **Purpose:** ask eligible automatic providers for a result.
- **Called by:** Core, Communication command, or delayed-work coordinator.
- **Trigger/mechanism:** boot/rescan; DIRECT CALL or WORKQUEUE.
- **Execution context:** thread/workqueue, never ISR; may be asynchronous.
- **Inputs:** port ID and timeout/cancellation token.
- **Outputs:** accepted/no-result/ambiguous status, possibly later callback.
- **State modified:** scan state and generation.
- **Failure cases:** timeout, unsupported port, provider error, conflict.
- **Called next:** provider callback/API, then Manager only after policy accepts.

### `spaghetti_discovery_invalidate()`

- **Purpose:** mark a prior observation stale after removal/config change.
- **Called by:** presence handling, Communication, Config.
- **Trigger/mechanism/context:** event/command; DIRECT CALL in thread context.
- **Inputs:** port and generation/reason.
- **Outputs:** status.
- **State modified:** per-port result.
- **Failure cases:** stale generation or unknown port.
- **Called next:** Manager remove by DIRECT CALL or command queue.

## Interaction diagram

```text
Backend --COMMUNICATION RX--> Communication --DIRECT CALL--> Discovery(manual)
Future provider --CALLBACK/WORKQUEUE--> Discovery policy
Discovery --DIRECT CALL initially / DECISION REQUIRED queue--> Module Manager
```

## State / lifecycle

```text
UNKNOWN -> SEARCHING -> PROPOSED -> ACCEPTED
              |             +----> CONFLICT
              +------------------> NO_RESULT
ACCEPTED -> STALE/UNKNOWN
```

## Concurrency considerations

Provider results can arrive late. Use generation tokens and serialize per-port
policy updates. Manual submission can remain synchronous. Automatic probing may
use delayable work. DECISION REQUIRED: use a Manager `k_msgq` once concurrent
reconfiguration exists; a direct call is simpler beforehand.

## Zephyr concepts involved

- `k_work_delayable` schedules deferred probing without a dedicated thread.
- Callback returns an asynchronous provider result; callback must not do long
  lifecycle work.
- `k_msgq` may serialize commands and retain bounded ordering.
- zbus is suitable for observing discovery status, not necessarily for commands.

## Implementation steps

1. Define normalized result/source/policy types.
2. Implement MANUAL-only submission.
3. Add generation and invalidation.
4. Connect to Manager with a direct call.
5. Define provider interface using a fake provider.
6. Add AUTO/HYBRID only with concrete conflict rules.

## Expected result

Manual and future automatic sources yield the same result contract; Manager does
not change when a provider is added.

## Minimal test

Submit manual `Port 0 -> fake`, then test stale revision and invalidation.

## Dependencies

Port identifiers, Config policy, Module Manager configure/remove contract.

## Not yet

No EEPROM-specific API, invented probe method, or assumption that AUTO succeeds.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_discovery_init` | Core | boot | DIRECT CALL | main thread | provider init |
| `spaghetti_discovery_submit_manual` | Communication/Config | assignment | COMMUNICATION RX + DIRECT CALL | communication/caller thread | Manager configure |
| `spaghetti_discovery_run` | Core/Communication | scan | DIRECT CALL / WORKQUEUE | worker thread | provider operation |
| `spaghetti_discovery_invalidate` | presence/Communication | stale result | DIRECT CALL | caller thread | Manager remove |

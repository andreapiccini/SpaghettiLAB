# Services

## 1. Purpose

Services contains reusable software capabilities used by architecture layers but
not responsible for product policy: MQTT transport, timing, and persistence.

## 2. Responsibility

Define narrow lifecycle/operation contracts, hide Zephyr backend details, expose
bounded resource/error behavior, and remain independently testable.

## 3. Non-responsibility

Services do not own module instances, user logic, discovery policy, or the global
boot sequence. A service must not become a miscellaneous utility collection.

## 4. Files

- `mqtt/README.md`: networked publish/subscribe capability.
- `timer/README.md`: named one-shot/periodic scheduling capability.
- `storage/README.md`: persistent key/blob capability.
- Future service source/header files are intentionally not defined yet.

## 5. Data structures to implement

Each service owns its private context for firmware lifetime and exposes opaque
handles or copied snapshots. Cross-service global state is forbidden; Core owns
startup order.

## 6. Functions to implement

### Service-specific `init` and `start/stop`

- **Purpose:** separate construction from asynchronous execution.
- **Called by:** Core or the direct owning subsystem.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs/outputs:** validated config/dependencies; status.
- **State modified:** private service state.
- **Failure cases:** unavailable dependency/resource.
- **Called next:** documented Zephyr backend for that service.

## 7. Interaction diagram

```text
Core --DIRECT CALL--> Service init/start --> Zephyr backend
Owning subsystem --DIRECT CALL / bounded queue--> Service operation
```

## 8. State / lifecycle

Common model: UNINITIALIZED -> READY -> RUNNING -> STOPPED/ERROR. A service may
omit states that add no useful behavior.

## 9. Concurrency considerations

Do not create one thread per service automatically. MQTT likely needs a blocking
state-machine context; Storage may be synchronous/serialized; Timer uses kernel
timers plus deferred delivery. Each child README owns the final decision.

## 10. Zephyr concepts involved

Services wrap, rather than duplicate, Zephyr subsystems. Kconfig will later
select required software. Logging and explicit bounded resources apply to all.

## 11. Implementation steps

1. Implement a service only when a consumer milestone needs it.
2. Define ownership/error/timeout contract.
3. Test with a fake backend.
4. Integrate the smallest Zephyr backend.
5. Measure RAM, stack, and queue capacity.

## 12. Expected result

Consumers use a stable product-level capability without knowing backend details.

## 13. Minimal test

Each child service supplies its own single-capability test.

## 14. Dependencies

Core for orchestration; service-specific Zephyr features and Kconfig later.

## 15. Not yet

No generic service locator, dependency injection framework, or speculative service.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| service `init` | Core | boot | DIRECT CALL | main thread | Zephyr backend init |
| service `start/stop` | Core/owner | lifecycle | DIRECT CALL | caller thread | backend lifecycle |

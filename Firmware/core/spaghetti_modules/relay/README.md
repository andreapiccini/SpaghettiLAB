# Relay Module

## 1. Purpose

This future implementation controls one external relay module through the Port
capability actually defined by its hardware.

## 2. Responsibility

Validate capability/config, initialize safe state, apply ON/OFF commands, expose
known state/diagnostics, and leave the relay safe during deinit where hardware
permits.

## 3. Non-responsibility

No threshold rule, timer, discovery, port assignment, MQTT, or invented active
level/GPIO mapping.

## 4. Files

Only this design README exists. The implementation will use the generic public
Module Driver contract; hardware-specific details remain local.

## 5. Data structures to implement

- static relay driver descriptor owned here.
- per-instance context owned by Manager and modified by relay operations.
- command/state types describing logical ON/OFF independently of electrical level.

## 6. Functions to implement

### Relay `init`

- **Purpose:** validate capability and enter documented safe logical state.
- **Called by:** Module Manager on assignment.
- **Trigger/mechanism/context:** configure; DIRECT CALL; thread.
- **Inputs:** Port, context, validated safe-state config.
- **Outputs:** status.
- **State modified:** instance/hardware output.
- **Failure cases:** unsupported capability, output unavailable, invalid config.
- **Called next:** Port operation by DIRECT CALL.

### Relay `command`

- **Purpose:** atomically request logical ON or OFF.
- **Called by:** Module Manager for Runtime/Communication.
- **Trigger/mechanism/context:** user rule/manual command; DIRECT CALL; thread.
- **Inputs:** instance and logical target state.
- **Outputs:** applied/error and optional observed state.
- **State modified:** relay private/current state.
- **Failure cases:** not ready, invalid command, hardware/Port failure.
- **Called next:** Port then Zephyr peripheral API.

### Relay `deinit`

- **Purpose:** enter defined safe state and release resources.
- **Called by:** Module Manager on remove/rollback.
- **Trigger/mechanism/context:** lifecycle; DIRECT CALL; thread.
- **Inputs/outputs:** context; status.
- **State modified:** context/hardware state.
- **Failure cases:** safe transition failure.
- **Called next:** Port/Power release.

## 7. Interaction diagram

```text
Runtime --DIRECT CALL--> Manager --DIRECT CALL--> Relay command
Relay --DIRECT CALL--> Port --DIRECT CALL--> Zephyr peripheral API
```

## 8. State / lifecycle

UNINITIALIZED -> SAFE/READY -> ON/OFF -> SAFE -> REMOVED, with FAULT reachable
from hardware operations.

## 9. Concurrency considerations

Commands remain synchronous and serialized by Manager/Port. No thread or zbus is
needed in the driver. State-change publication may occur through Data after the
command returns, outside any Port lock.

## 10. Zephyr concepts involved

GPIO or another peripheral API will be chosen only from the real module/port
hardware. Devicetree describes Core wiring, not logical relay identity.

## 11. Implementation steps

1. Confirm electrical interface and safe state from hardware documentation.
2. Declare required Port capability.
3. Test fake logical ON/OFF conversion.
4. Implement init/command/deinit through Port.
5. Test boot/removal/failure safety.

## 12. Expected result

A READY relay follows logical commands and transitions safely on removal/error.

## 13. Minimal test

Fake Port records OFF, ON, OFF sequence and an injected hardware failure.

## 14. Dependencies

Module Driver, Port, Manager; Data only for state publication.

## 15. Not yet

No guessed active level, pin number, latching behavior, timing, or automation.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| Relay `init` | Manager | assignment | DIRECT CALL | Manager thread | Port |
| Relay `command` | Manager | Runtime/manual action | DIRECT CALL | Runtime/Manager thread | Port/peripheral API |
| Relay `deinit` | Manager | remove/rollback | DIRECT CALL | Manager thread | Port/Power |

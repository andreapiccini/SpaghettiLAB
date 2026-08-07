# Spaghetti LAB Devicetree Bindings

[← Project README](../../../README.md) · [Architecture](../../../ARCHITECTURE.md) · [Roadmap](../../../IMPLEMENTATION_ROADMAP.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

A Zephyr Devicetree binding is a YAML schema giving meaning and validation rules
to DTS nodes with a matching `compatible`. These future bindings will define the
static hardware representation of Spaghetti Core ports.

## Responsibility

Describe valid node structure, required/optional hardware properties, property
types, inherited GPIO/bus conventions, and generated metadata semantics.

## Non-responsibility

Bindings do not identify a removable module, execute code, select runtime policy,
or contain actual board GPIO values.

## Files

Only this README exists. Future YAML names must follow their actual `compatible`
and Zephyr binding conventions. Board DTS nodes consume the binding; `port.c`
consumes generated macros.

## Data structures to implement

No C runtime object is owned here. YAML schemas validate DTS properties; build
tools generate node/property macros from valid board descriptions.

## Functions to implement

There are no runtime functions.

### Binding validation/generation

- **Purpose:** validate matching nodes and define property semantics.
- **Called by:** Zephyr Devicetree build tools.
- **Trigger/mechanism/context:** build configuration; BUILD-TIME PROCESSING; host.
- **Inputs:** YAML binding plus board DTS.
- **Outputs:** validation result and generated Devicetree macros.
- **State modified:** generated build artifacts only.
- **Failure cases:** missing required property, wrong type, invalid reference.
- **Called next:** generated headers consumed by `port.c` at compile time.

## Interaction diagram

```text
YAML binding
     |
     | validates/describes at BUILD TIME
     v
Devicetree node
     |
     | Zephyr generates macros/specifiers
     v
port.c compiled descriptors
```

## State / lifecycle

Bindings are evaluated at build time and have no runtime lifecycle.

## Concurrency considerations

None. Concurrency belongs to Port objects created from generated information.

## Zephyr concepts involved

`compatible` selects a binding. `properties` validates node fields. Phandles and
specifier arrays reference controllers such as GPIO. Generated macros allow C to
consume hardware without parsing DTS at runtime. Binding YAML is Zephyr-specific,
not an implementation of a driver.

## Implementation steps

1. Define the minimum physical meaning of a Spaghetti Port from real hardware.
2. Check whether existing standard bindings/specifiers can be reused.
3. Choose vendor-compatible naming and property semantics.
4. Create the smallest binding and one valid DTS node.
5. Add build tests for missing/wrong properties.
6. Consume generated values in Port, not in higher layers.

## Expected result

Valid static ports compile into descriptors; invalid hardware descriptions fail
at build time with useful errors.

## Minimal test

Build one valid sample and one DTS fixture missing a required example property.

## Dependencies

A stable physical Port model and actual board schematic.

## Not yet

No production YAML, final property list, GPIO values, SHT40/Relay assignment, or
EEPROM discovery property until requirements are real.

## Conceptual YAML template

This is intentionally incomplete. Ellipses and uppercase identifiers are
placeholders, not proposed final properties.

```yaml
description: Spaghetti LAB external module port

compatible: "spaghettilab,port"

properties:
  reg:
    type: int
    required: true
    description: Conceptual logical port index

  # EXAMPLE ONLY. Add real properties after the physical contract is defined.
  # power-gpios:
  #   type: phandle-array
  #   description: Optional physical power control for this Core port

  # ... future bus/capability representation: DECISION REQUIRED ...
```

The binding specifies what a property means; the board DTS supplies its real
value; generated macros feed Port. It must never say that a port currently holds
an SHT40.

| Build element | Called by | Trigger | Mechanism | Execution context | Calls/produces |
|---|---|---|---|---|---|
| binding match | Zephyr DT tools | configure | BUILD-TIME | host | schema validation |
| macro generation | Zephyr DT tools | valid DTS | BUILD-TIME | host | generated C macros |
| generated access | Port compile | C compilation | COMPILE-TIME | host compiler | static descriptor |

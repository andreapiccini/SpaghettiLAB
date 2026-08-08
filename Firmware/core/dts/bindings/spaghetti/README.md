# Spaghetti LAB Devicetree bindings

[← Project README](../../../README.md) · [Architecture](../../../ARCHITECTURE.md)

A Devicetree binding is a YAML schema for static hardware. The Spaghetti Port binding validates that every board describes a physical connector in the same machine-readable form.

## What this component owns

- The meaning and type of each `spaghettilab,port` property.
- Required/optional property rules.
- Build-time validation of Port nodes.

## What this component does not own

- Concrete GPIO numbers or controller choices for a board.
- Runtime module identity.
- C lifecycle behavior or discovery policy.

## Files

| File | Role |
|---|---|
| `spaghettilab,port.yaml` | Schema for one physical Port node. |
| Board `.dts` files | Concrete instances validated against the schema. |
| `build/zephyr/zephyr.dts` | Generated result used to verify the final topology; never edit it. |

## Data model

| Type / object | Owner | Meaning |
|---|---|---|
| `reg` | Board DTS | Stable logical Port index. |
| `capabilities` | Board DTS | Operations physically supported by the connector. |
| Bus phandle | Board DTS | Reference to a real static Zephyr controller. |
| Optional GPIO specifier | Board DTS | Presence, enable, or interrupt line only when physically present. |

## API contract

This component has no runtime C API. Its contract is processed at build time.

## How it works

```mermaid
flowchart LR
    YAML["Binding YAML <br/> defines valid properties"]
    DTS["Board DTS <br/> supplies real values"]
    VALIDATE["Devicetree validation"]
    MACROS["Generated C macros"]
    PORT["Port initialization"]
    YAML --> VALIDATE
    DTS --> VALIDATE
    VALIDATE --> MACROS --> PORT
```

## Practical example

A board declares Port 0 with I2C capability and an `i2c-bus` phandle. The binding rejects the build if the Port has no `reg`, uses an invalid capability string, or references a nonexistent controller.

## Zephyr integration

- Bindings validate at configure time, before C compilation.
- A phandle references another Devicetree node; Port converts the generated reference into a Zephyr device.
- `status = "okay"` enables an instance; disabled nodes are not exposed as usable Ports.

## Configuration templates

### Binding template

```yaml
description: Spaghetti LAB external module port

compatible: "spaghettilab,port"

include: base.yaml

properties:
  reg:
    type: int
    required: true
    description: Stable logical Port index

  capabilities:
    type: string-array
    required: true
    description: >
      Operations physically supported by this connector. Project-defined
      values are i2c, spi, and gpio.

  i2c-bus:
    type: phandle
    description: I2C controller wired to the Port

  power-gpios:
    type: phandle-array
    description: Optional real power-enable control
```

### Matching DTS instance

```dts
port0: port@0 {
    compatible = "spaghettilab,port";
    reg = <0>;
    capabilities = "i2c";
    i2c-bus = <&i2c0>;
    status = "okay";
};
```

Property names and combinations must reflect the final binding. If, for
example, every I2C-capable Port requires `i2c-bus`, encode that relationship
in the schema rather than relying on a runtime failure.

## Ownership and concurrency

Bindings have no runtime state. Validation and macro generation happen in the single build pipeline.

## Contract guarantees

- Invalid static Port descriptions fail the build.
- Bindings contain no board-specific numeric values.
- Bindings describe connector hardware, never the removable module attached to it.

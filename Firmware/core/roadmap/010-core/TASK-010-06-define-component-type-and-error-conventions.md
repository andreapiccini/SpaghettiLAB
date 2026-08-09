# TASK-010-06 — Define component type and error conventions

**Status:** ⬜ TODO
**Phase:** 010 — Core
**Depends on:** [TASK-010-05](TASK-010-05-structure-firmware-logging.md)
**Estimated scope:** Medium

---

## Goal

Define one repeatable type-design process for every firmware component and
produce this focused outcome:

Domain values have meaningful component-owned names while fallible Zephyr-facing
operations retain interoperable negative errno return values.

---

## Open

`FIRMWARE_IMPLEMENTATION_GUIDE.md`,
`templates/firmware/change_contract.md.template`,
`templates/firmware/public_api.h.template`, `roadmap/README.md`, and the task
indexes for future component phases.

---

## Write / Modify

Add a mandatory **Type inventory** step before each component API or algorithm is
implemented. The inventory names every state, identifier, mode, command, value,
configuration, snapshot, diagnostic reason, and buffer length crossing the
component boundary.

Update the roadmap so each future component phase defines its public types before
implementing state or algorithms. Reuse an existing focused type/API task when it
already provides that gate; add or split a task only when a phase currently jumps
directly from prose to untyped implementation.

Do not create all future firmware types in this task. This task defines the
decision rules and ensures later tasks introduce each type only when its component
contract becomes concrete.

---

## Why

A variable such as `int value`, `int state`, or `int error` does not communicate
which values are valid, which component owns the meaning, or whether the value is
a domain result or an operating-system failure.

At the same time, replacing every `int` return with a custom error enum would
discard Zephyr's standard negative errno convention and make driver errors harder
to propagate. The type system must improve meaning without breaking integration.

---

## Ownership rule

The component that defines the meaning owns the type:

| Meaning | Owner and location | Example |
|---|---|---|
| Core lifecycle | Core public header | `enum spaghetti_core_state` |
| Port identity/capability | Port public header | `spaghetti_port_id_t`, capability flags |
| Module kind/state | Module public header | `enum spaghetti_module_state` |
| Driver command | Module Driver contract | `enum spaghetti_module_command` |
| Runtime configuration | Config/Runtime contract | `struct spaghetti_runtime_config` |
| Wire/protocol code | Adapter-private boundary | decoded into a domain enum before dispatch |
| Zephyr/driver failure | Function return | `int`, zero or negative errno |

A higher layer must not redefine a lower component's enum or copy its values into
anonymous integers.

---

## Type decision rules

### Use an enum

Use `enum spaghetti_<component>_<name>` when the valid values form a small,
closed vocabulary known at compile time:

- lifecycle state;
- mode or policy;
- command or event kind;
- value/discriminator kind;
- domain diagnostic reason on which callers genuinely branch.

Every public enumerator uses the full component prefix and has a documented
meaning. External enum inputs are validated because C accepts integer values not
listed by the declaration.

### Use a struct

Use `struct spaghetti_<component>_<name>` when fields belong together and must be
validated, copied, versioned, or returned as one coherent snapshot:

- configuration;
- sample/value plus unit and timestamp;
- status snapshot;
- bounded request/response;
- detailed diagnostic output.

Do not create a one-field struct merely to avoid a scalar.

### Use a typedef

Use a project typedef only when it creates a stable domain abstraction, such as a
Port ID whose representation may change. Do not hide ordinary pointers, structs,
fixed-width integers, or ownership behind decorative typedefs.

### Use fixed-width integers

Use `uint8_t`, `uint16_t`, `uint32_t`, `uint64_t`, and signed equivalents for
protocol fields, persisted values, counters with defined bounds, and hardware
register data. Document range and unit. Do not use plain `int` for a domain value
only because it is convenient.

### Keep int for operation status

A function that can fail returns `int`: `0` for success and a precise negative
errno for failure. Public Doxygen lists every expected result with `@retval`.
Callers preserve dependency errors unless they can add a more precise contract.

The local variable holding that result uses a short scope and a conventional
name such as `ret`. It is checked immediately and is never stored as component
state merely to avoid handling it.

### Add a diagnostic enum only when needed

If callers need a domain reason beyond errno, keep the function return as `int`
and provide a separate typed output, for example:

```c
enum spaghetti_config_reject_reason {
	SPAGHETTI_CONFIG_REJECT_NONE,
	SPAGHETTI_CONFIG_REJECT_UNKNOWN_PORT,
	SPAGHETTI_CONFIG_REJECT_UNSUPPORTED_DRIVER
};

struct spaghetti_config_diagnostic {
	enum spaghetti_config_reject_reason reason;
	uint16_t item_index;
};
```

The API may return `-EINVAL` while the optional diagnostic explains which domain
rule rejected the candidate. Do not create a custom error enum when callers only
need success/failure or when it would duplicate errno values.

---

## Called / used by

Every later public API, implementation task, code review, validator rule, and
firmware template.

---

## Trigger

DESIGN TIME, before the first public declaration for a component or feature.

---

## Invocation mechanism

Human design checklist enforced by task ordering, templates, Doxygen review, and
focused validator rules where mechanical checks are reliable.

---

## Execution context

Not applicable at runtime. The produced types document runtime ownership and
execution constraints.

---

## Inputs

- Component responsibility and owner from `ARCHITECTURE.md`.
- Inputs, outputs, ranges, units, lifetime, and failure behavior from its README.
- Zephyr API types and negative errno contracts used at the boundary.

---

## Outputs

- A mandatory type-inventory section in the change-contract template.
- Copyable enum/struct/result patterns in the public-header template.
- An implementation-guide decision table for enum, struct, typedef, scalar,
  errno, and optional typed diagnostics.
- Future roadmap phases ordered so types precede algorithms.

---

## Errors to handle

- Two components claim ownership of the same type.
- A public integer has no range, unit, or semantic name.
- A custom enum duplicates `errno` without adding domain meaning.
- An enum is used for an open-ended ID or numeric measurement.
- A struct exposes writable internal state or pointer lifetime ambiguity.
- A later task consumes a type before the defining task.

---

## Do NOT implement yet

- Concrete future Port, Module, Config, Data, Runtime, MQTT, or Power types.
- One shared `common_types.h` dumping ground.
- Global error variables, exception-like macros, or hidden early returns.
- Custom replacements for Zephyr errno values.
- Wire-format enums leaking directly into component-owned domain APIs.

---

## Steps

- [ ] Add the mandatory type inventory and ownership questions to the change-contract template.
- [ ] Add documented enum, struct, fixed-width scalar, errno return, and optional diagnostic-output examples to the public API template.
- [ ] Consolidate the decision rules in the implementation guide without duplicating conflicting advice.
- [ ] Audit every future phase index: its type/API task must precede state, algorithms, threads, persistence, or transports that consume those types.
- [ ] Record an explicit type owner in each affected component README's data model when that owner is currently ambiguous.
- [ ] Confirm current `enum spaghetti_core_state` follows the new rules without adding speculative Core types.
- [ ] Run documentation link checks and the validator.
- [ ] Confirm no item from **Do NOT implement yet** was added.

---

## Build

NO — this task changes conventions, templates, and roadmap ordering only.

---

## Flash

NO.

---

## Test

Choose one planned type from Core, Port, Module, Config, Data, and Runtime. For
each, identify its owner, representation category, valid values/range, unit,
public/private location, and function error convention without inventing its
implementation.

Review every future phase index and confirm no algorithm task appears before the
task that defines the types it consumes.

---

## Expected result

A developer can decide from the guide and templates whether a new value is an
enum, struct, typedef, fixed-width scalar, errno return, or separate diagnostic.
Every future component defines meaningful types before algorithms, while Zephyr
errors remain directly interoperable.

---

## Completion checklist

- [ ] Type inventory is mandatory in the change-contract workflow.
- [ ] Templates contain copyable, documented type and result patterns.
- [ ] Enum, struct, typedef, scalar, errno, and diagnostic decisions are unambiguous.
- [ ] Every future component phase defines types before consuming them.
- [ ] Core state satisfies the policy without speculative additions.
- [ ] No common-type dumping ground or custom errno replacement was introduced.

---

## Commit suggestion

`docs: define component type and error conventions`

---

## Next task

[TASK-010-07](TASK-010-07-build-and-flash-the-core-boundary.md) — Build and flash the Core boundary

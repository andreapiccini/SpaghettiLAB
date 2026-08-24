import { domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import type { PropertySet, PropertyValue } from "./canonical-config.js";
import { ConfigCompilerErrorCode } from "./errors.js";

/**
 * Firmware's `properties` map is keyed by real numeric `field_id`
 * (`encode_properties`/`decode_properties`, `config_cbor.c`) — this
 * package's node data (`ModuleNodeData.properties`,
 * `BlockNodeData.properties`, `RuleNodeData.properties`) is a plain
 * `Record<string, unknown>` with no schema behind it yet (no live Block/Rule
 * property schema exists on the wire — same gap `device-processing-graph-model`
 * already documents for ports). Until a real schema resolver exists, this
 * compiler keeps numeric field IDs (e.g. `{"1": 100n}`) and skips authoring-only
 * keys (`op`, `level`, `action`). `PropertyValue` excludes plain `number` on
 * purpose — firmware's CBOR encoder rejects float values everywhere on the
 * Config wire, so this only accepts `bigint`/`boolean`/`string` to avoid a
 * caller accidentally handing a non-integer JS number through.
 */
export function toPropertySet(nodeId: string, raw: Readonly<Record<string, unknown>>): Result<PropertySet, DomainError[]> {
  const errors: DomainError[] = [];
  const out: Record<number, PropertyValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    const fieldId = Number(key);
    if (!Number.isInteger(fieldId) || fieldId <= 0 || fieldId > 0xffff) {
      // Authoring-only keys (`op`, `level`, `action`, …) stay on the node
      // and are ignored on the wire.
      continue;
    }
    if (typeof value !== "boolean" && typeof value !== "bigint" && typeof value !== "string") {
      errors.push(
        domainError({
          code: ConfigCompilerErrorCode.UNRESOLVED_PROPERTY_FIELD_ID,
          path: ["config-compiler", "nodes", nodeId, "properties", key],
          target: String(value),
          remediation: "property values must be boolean, bigint, or string — plain JS numbers are rejected to avoid an accidental float on the wire",
        }),
      );
      continue;
    }
    out[fieldId] = value;
  }
  return errors.length > 0 ? err(errors) : ok(out);
}

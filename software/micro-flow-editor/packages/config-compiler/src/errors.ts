/**
 * Mirrors `enum spaghetti_config_failure_field`/`spaghetti_config_failure_reason`
 * (`config.h`) as much as this compiler's own error taxonomy needs — see
 * `compile.ts`'s doc comment on why graph-level (Block/Edge) failures need
 * this compiler's own owner attribution rather than firmware's (firmware
 * itself reports `index: 0` for those, per its own validator).
 */
export const ConfigCompilerErrorCode = {
  CAPACITY_EXCEEDED: "config-compiler.capacity_exceeded",
  UNRESOLVED_PORT_OR_FIELD: "config-compiler.unresolved_port_or_field",
  UNRESOLVED_PROPERTY_FIELD_ID: "config-compiler.unresolved_property_field_id",
  UNRESOLVED_RULE_ACTION: "config-compiler.unresolved_rule_action",
  DANGLING_MODULE_REFERENCE: "config-compiler.dangling_module_reference",
  COST_BUDGET_EXCEEDED: "config-compiler.cost_budget_exceeded",
  FAN_OUT_EXCEEDED: "config-compiler.fan_out_exceeded",
  DEPTH_EXCEEDED: "config-compiler.depth_exceeded",
} as const;

export const PhysicalCompositionErrorCode = {
  PORT_NOT_DECLARED: "physical-composition.port_not_declared",
  BAY_NOT_DECLARED: "physical-composition.bay_not_declared",
  RAIL_NOT_DECLARED: "physical-composition.rail_not_declared",
  TRANSPORT_MISMATCH: "physical-composition.transport_mismatch",
  ENDPOINT_COLLISION: "physical-composition.endpoint_collision",
  MODULE_KEY_CONFLICT: "physical-composition.module_key_conflict",
  MISSING_POWER_ACKNOWLEDGEMENT: "physical-composition.missing_power_acknowledgement",
} as const;

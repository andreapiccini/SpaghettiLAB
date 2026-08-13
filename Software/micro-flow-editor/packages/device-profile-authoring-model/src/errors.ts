export const DeviceProfileErrorCode = {
  INVALID_PROFILE_ID: "device-profile.invalid_profile_id",
  INVALID_SCHEMA_ID: "device-profile.invalid_schema_id",
  TEMP_SLOT_OUT_OF_RANGE: "device-profile.temp_slot_out_of_range",
  UNBOUNDED_WAIT: "device-profile.unbounded_wait",
  DUPLICATE_FIELD_ID: "device-profile.duplicate_field_id",
  DUPLICATE_FIELD_NAME: "device-profile.duplicate_field_name",
  FIELD_NAME_TOO_LONG: "device-profile.field_name_too_long",
  UNIT_NAME_TOO_LONG: "device-profile.unit_name_too_long",
  UNKNOWN_EMITTED_FIELD: "device-profile.unknown_emitted_field",
  UNEMITTED_FIELD: "device-profile.unemitted_field",
  TIME_BUDGET_EXCEEDED: "device-profile.time_budget_exceeded",
  TRANSACTION_BUDGET_EXCEEDED: "device-profile.transaction_budget_exceeded",
  BYTE_BUDGET_EXCEEDED: "device-profile.byte_budget_exceeded",
  OPERATION_COUNT_EXCEEDED: "device-profile.operation_count_exceeded",
  // fromRawOp (S063)
  UNKNOWN_OPCODE: "device-profile.unknown_opcode",
  INVALID_RAW_OPERAND: "device-profile.invalid_raw_operand",
} as const;

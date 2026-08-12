/** Error codes owned by this package — see `@spaghettilab/domain`'s `DomainErrorCode` comment on why each package keeps its own namespace instead of a shared global enum. */
export const EditorModelErrorCode = {
  DIRECTION_MISMATCH: "editor-model.compatibility.direction_mismatch",
  TYPE_MISMATCH: "editor-model.compatibility.type_mismatch",
  UNIT_MISMATCH: "editor-model.compatibility.unit_mismatch",
  REFERENCE_GROUP_MISMATCH: "editor-model.compatibility.reference_group_mismatch",
  SEMANTIC_GROUP_MISMATCH: "editor-model.compatibility.semantic_group_mismatch",
  FLOW_MISMATCH: "editor-model.compatibility.flow_mismatch",
  MISSING_CAPABILITY: "editor-model.compatibility.missing_capability",
  INVALID_FIELD_DESCRIPTOR: "editor-model.form.invalid_field_descriptor",
} as const;

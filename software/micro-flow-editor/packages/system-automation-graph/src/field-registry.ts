/**
 * A field/command's type and unit metadata — never observed on the
 * Protocol V1 wire. `@spaghettilab/catalog-model`'s own S041 README already
 * documents this gap: every operation's schema descriptor is unpopulated
 * (`.fields = NULL, .field_count = 0`), so there is no Rule/Block/opcode/
 * operation/schema/field/command listing to read from the wire at all. A
 * type/unit registry is therefore always caller-supplied — from a Device
 * Profile's declared `sampleFields` (`@spaghettilab/device-profile-authoring-model`)
 * or a Block/Rule catalog entry's declared property types
 * (`@spaghettilab/editor-model`), never invented here.
 */
export type FieldDescriptor = {
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly fieldId: number;
  readonly valueType: string;
  readonly unit?: string;
};

export type CommandDescriptor = {
  readonly moduleKey: number;
  readonly commandId: number;
  readonly valueType?: string;
  readonly unit?: string;
};

/** A caller-supplied lookup — this package never invents field/command metadata that isn't on the wire. */
export type FieldRegistry = {
  resolveField(schemaId: string, schemaVersion: number, fieldId: number): FieldDescriptor | undefined;
  resolveCommand(moduleKey: number, commandId: number): CommandDescriptor | undefined;
};

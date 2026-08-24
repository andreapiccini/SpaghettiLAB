/** Abstract generator for the UUIDs used as branded domain IDs (Project, Core binding, Module, ...). */
export interface UuidGenerator {
  generate(): string;
}

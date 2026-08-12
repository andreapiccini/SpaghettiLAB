/**
 * Every value shape a property/form field or a handle can carry. `"int"`/
 * `"uint"` cover both JS-safe and 64-bit values — see `FieldDescriptor.
 * losslessInteger` for which is which (S021's lossless bigint↔JSON rule
 * applies whenever it's true).
 */
export type FieldKind = "bool" | "int" | "uint" | "bytes" | "text" | "enum" | "reference" | "fixed-point";

import { isCommandEndpoint, isRecordFieldEndpoint, type SystemAutomationLink } from "@spaghettilab/system-automation-graph";
import type { RecordSourceMessage } from "./record-source.js";

export type LinkTransform = (value: unknown) => unknown;

/** Same caller-supplied stance as `@spaghettilab/system-automation-graph`'s `FieldRegistry` — the actual conversion math (e.g. celsius-to-fahrenheit) is real business logic this package never invents. */
export type TransformRegistry = {
  resolve(name: string): LinkTransform | undefined;
};

export type CommandInvocation = {
  readonly moduleKey: number;
  readonly commandId: number;
  readonly value: unknown;
};

export const CoordinateOutcome = {
  ROUTED: "ROUTED",
  NOT_MATCHED: "NOT_MATCHED",
  TRANSFORM_UNRESOLVED: "TRANSFORM_UNRESOLVED",
} as const;

export type CoordinateResult =
  | { readonly kind: "ROUTED"; readonly invocation: CommandInvocation }
  | { readonly kind: "NOT_MATCHED" }
  | { readonly kind: "TRANSFORM_UNRESOLVED"; readonly transformation: string };

/**
 * The `coordinator` node's routing decision for one `record source` message
 * against one `@spaghettilab/system-automation-graph` link (S111) — never a
 * fresh compatibility judgment of its own. A link this function receives
 * already passed `createSystemAutomationLink()`'s compatibility check at
 * authoring time; this function's only job is applying the link's already-
 * validated `transformation`, if any, to the concrete value now in hand.
 *
 * `NOT_MATCHED` means the message doesn't match this link's source at all
 * (wrong `sourceKey`/`schemaId`/`schemaVersion`, or the link's source isn't
 * a record-field endpoint) — a caller routing many links against one
 * message stream expects most links to simply not match, so this is a
 * normal outcome, not an error. `TRANSFORM_UNRESOLVED` means the link *does*
 * match but declares a `transformation` the supplied `TransformRegistry`
 * cannot resolve — never silently forwarded untransformed (same "never
 * converts implicitly" rule `checkFieldCompatibility()` already enforces at
 * authoring time).
 */
export function coordinateRecordToCommand(link: SystemAutomationLink, message: RecordSourceMessage, transforms: TransformRegistry): CoordinateResult {
  if (!isRecordFieldEndpoint(link.source) || !isCommandEndpoint(link.target)) return { kind: CoordinateOutcome.NOT_MATCHED };
  if (link.source.sourceKey !== message.sourceKey || link.source.schemaId !== message.schemaId || link.source.schemaVersion !== message.schemaVersion) {
    return { kind: CoordinateOutcome.NOT_MATCHED };
  }

  const rawValue = message.fields?.[link.source.fieldId];
  if (!link.transformation) {
    return { kind: CoordinateOutcome.ROUTED, invocation: { moduleKey: link.target.moduleKey, commandId: link.target.commandId, value: rawValue } };
  }

  const transform = transforms.resolve(link.transformation);
  if (!transform) {
    return { kind: CoordinateOutcome.TRANSFORM_UNRESOLVED, transformation: link.transformation };
  }
  return { kind: CoordinateOutcome.ROUTED, invocation: { moduleKey: link.target.moduleKey, commandId: link.target.commandId, value: transform(rawValue) } };
}

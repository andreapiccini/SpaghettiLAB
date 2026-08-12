import { decodeOne, encodeArray } from "../cbor.js";
import { boolField, decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireArray, requireBool, requireMap, requireText, requireU32, textField, u32Field } from "../fields.js";

/** `GET_STATUS` (op 2) has an empty request payload. */
export const encodeGetStatusRequest = encodeEmptyPayload;
export function decodeGetStatusRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "GetStatusRequest");
}

/**
 * `GET_STATUS` (op 2) response — `status.c`. Enum-shaped fields (`state`,
 * `mode`, `imageState`, `healthState`, module `state`, `endpointKind`) are
 * kept as plain numbers rather than guessed TS enum members: this pass only
 * has the enum *names* from the firmware source
 * (`spaghetti_core_state`/`_mode`/`_image_state`/`_health_state`/
 * `_module_state`, `endpoint.kind`), not their integer→label mapping —
 * inventing labels here would be worse than leaving the raw number, which
 * round-trips correctly regardless. Resolving real labels is a follow-up,
 * not a codec-correctness requirement.
 */
export type ModuleStatus = {
  readonly key: number;
  readonly id: number;
  readonly portId: number;
  readonly state: number;
  readonly endpointKind: number;
  /** First up to 4 raw bytes of `endpoint.value` reinterpreted as uint32 by the firmware — not a semantically meaningful integer on its own, see the S021 research note. */
  readonly endpointValueRaw: number;
  readonly typeId: string;
};

export type GetStatusResponse = {
  readonly state: number;
  readonly mode: number;
  readonly imageState: number;
  readonly activeSlot: number;
  readonly imageConfirmed: boolean;
  readonly version: string;
  readonly portCount: number;
  readonly lastResetCause: number;
  readonly healthState: number;
  readonly modules: readonly ModuleStatus[];
};

export function encodeGetStatusResponse(r: GetStatusResponse): Uint8Array {
  const modules = r.modules.map((m) =>
    encodeMap([
      u32Field(0, m.key),
      u32Field(1, m.id),
      u32Field(2, m.portId),
      u32Field(3, m.state),
      u32Field(4, m.endpointKind),
      u32Field(5, m.endpointValueRaw),
      textField(6, m.typeId),
    ]),
  );
  return encodeMap([
    u32Field(0, r.state),
    u32Field(1, r.mode),
    u32Field(2, r.imageState),
    u32Field(3, r.activeSlot),
    boolField(4, r.imageConfirmed),
    textField(5, r.version),
    u32Field(6, r.portCount),
    u32Field(7, r.lastResetCause),
    u32Field(8, r.healthState),
    [9, encodeArray(modules)],
  ]);
}

export function decodeGetStatusResponse(bytes: Uint8Array): GetStatusResponse {
  const map = requireMap(decodeOne(bytes), "GetStatusResponse");
  const modules = requireArray(map, 9, "GetStatusResponse").map((entry) => {
    const m = requireMap(entry, "GetStatusResponse.modules[]");
    return {
      key: requireU32(m, 0, "ModuleStatus"),
      id: requireU32(m, 1, "ModuleStatus"),
      portId: requireU32(m, 2, "ModuleStatus"),
      state: requireU32(m, 3, "ModuleStatus"),
      endpointKind: requireU32(m, 4, "ModuleStatus"),
      endpointValueRaw: requireU32(m, 5, "ModuleStatus"),
      typeId: requireText(m, 6, "ModuleStatus"),
    };
  });
  return {
    state: requireU32(map, 0, "GetStatusResponse"),
    mode: requireU32(map, 1, "GetStatusResponse"),
    imageState: requireU32(map, 2, "GetStatusResponse"),
    activeSlot: requireU32(map, 3, "GetStatusResponse"),
    imageConfirmed: requireBool(map, 4, "GetStatusResponse"),
    version: requireText(map, 5, "GetStatusResponse"),
    portCount: requireU32(map, 6, "GetStatusResponse"),
    lastResetCause: requireU32(map, 7, "GetStatusResponse"),
    healthState: requireU32(map, 8, "GetStatusResponse"),
    modules,
  };
}

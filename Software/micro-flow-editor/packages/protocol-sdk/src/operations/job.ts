import { decodeOne } from "../cbor.js";
import { encodeMap, requireMap, requireU32, u32Field } from "../fields.js";

/** `GET_JOB_STATUS` (op 19) request. */
export type GetJobStatusRequest = { readonly jobId: number };

export function encodeGetJobStatusRequest(r: GetJobStatusRequest): Uint8Array {
  return encodeMap([u32Field(0, r.jobId)]);
}

export function decodeGetJobStatusRequest(bytes: Uint8Array): GetJobStatusRequest {
  const map = requireMap(decodeOne(bytes), "GetJobStatusRequest");
  return { jobId: requireU32(map, 0, "GetJobStatusRequest") };
}

/** `spaghetti_job_state` (internal, `communication.c`): 0 FREE, 1 PENDING, 2 RUNNING, 3 COMPLETED, 4 FAILED, 5 CANCELLED, 6 EXPIRED. */
export enum JobState {
  FREE = 0,
  PENDING = 1,
  RUNNING = 2,
  COMPLETED = 3,
  FAILED = 4,
  CANCELLED = 5,
  EXPIRED = 6,
}

/**
 * `GET_JOB_STATUS` response — `communication.c`. **No result payload is
 * exposed here**: the firmware's internal job slot has a `result` field but
 * `spaghetti_communication_job_get_status` never encodes it onto the wire in
 * this protocol version (see the S021 research note's incompleteness list).
 * A caller can learn pass/fail via `protocolStatus`, not the job's actual
 * output data.
 */
export type GetJobStatusResponse = {
  readonly jobId: number;
  readonly state: JobState;
  readonly progress: number;
  readonly protocolStatus: number;
  readonly operation: number;
};

export function encodeGetJobStatusResponse(r: GetJobStatusResponse): Uint8Array {
  return encodeMap([
    u32Field(0, r.jobId),
    u32Field(1, r.state),
    u32Field(2, r.progress),
    u32Field(3, r.protocolStatus),
    u32Field(4, r.operation),
  ]);
}

export function decodeGetJobStatusResponse(bytes: Uint8Array): GetJobStatusResponse {
  const map = requireMap(decodeOne(bytes), "GetJobStatusResponse");
  return {
    jobId: requireU32(map, 0, "GetJobStatusResponse"),
    state: requireU32(map, 1, "GetJobStatusResponse") as JobState,
    progress: requireU32(map, 2, "GetJobStatusResponse"),
    protocolStatus: requireU32(map, 3, "GetJobStatusResponse"),
    operation: requireU32(map, 4, "GetJobStatusResponse"),
  };
}

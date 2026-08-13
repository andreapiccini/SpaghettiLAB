import { JobState, Operation, type GetJobStatusResponse } from "@spaghettilab/protocol-sdk";

const JOB_STATE_LABELS: Record<number, string> = {
  [JobState.FREE]: "FREE",
  [JobState.PENDING]: "PENDING",
  [JobState.RUNNING]: "RUNNING",
  [JobState.COMPLETED]: "COMPLETED",
  [JobState.FAILED]: "FAILED",
  [JobState.CANCELLED]: "CANCELLED",
  [JobState.EXPIRED]: "EXPIRED",
};

const OPERATION_NAME_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(Operation)
    .filter(([, v]) => typeof v === "number")
    .map(([name, id]) => [id as number, name]),
);

export type JobStatusView = {
  readonly jobId: number;
  readonly state: string;
  readonly progress: number;
  readonly protocolStatus: number;
  readonly operation: string;
};

/**
 * Readable projection of `GET_JOB_STATUS` (op 19), generic across job kinds
 * (discovery scan, OTA transfer, ...) — distinct from `@spaghettilab/core-actions`'s
 * `interpretJobStatus`, which classifies a discovery-scan job into one of a
 * small set of outcome kinds for that specific workflow. This function only
 * makes the raw response readable; it does not interpret it for any
 * particular caller.
 */
export function describeJobStatus(r: GetJobStatusResponse): JobStatusView {
  return {
    jobId: r.jobId,
    state: JOB_STATE_LABELS[r.state] ?? `UNKNOWN(${r.state})`,
    progress: r.progress,
    protocolStatus: r.protocolStatus,
    operation: OPERATION_NAME_BY_ID[r.operation] ?? `UNKNOWN(${r.operation})`,
  };
}

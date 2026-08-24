import type { ModuleStatusView } from "./status-view.js";

/**
 * Neither Schedule, Rule nor Block has any runtime status field on the
 * Protocol V1 wire — `GET_STATUS` (`status.c`, `execute_get_status`) only
 * ever serializes a per-Module list (field 9). A Schedule is nothing but a
 * `{enabled, source_key, period_ms}` toggle bound to one Module
 * (`struct spaghetti_runtime_schedule_config`), so the closest honest
 * "status" for it is the state of the Module it samples. A Rule or Block has
 * no such proxy at all: the only observable signal is whether its key is
 * present in the last successfully deployed Config — never whether it is
 * "currently executing" or "healthy", concepts the firmware does not expose
 * per-Rule/per-Block. This module makes that gap explicit rather than
 * fabricating a richer status than the wire actually provides.
 */

export type ScheduleStatusView = {
  readonly sourceModuleKey: number;
  readonly enabled: boolean;
  readonly periodMs: number;
  /** `"unknown"` when `sourceModuleKey` is not present in the last `GET_STATUS` module list at all. */
  readonly sourceModuleState: string;
};

export function describeScheduleStatus(
  schedule: { readonly sourceModuleKey: number; readonly enabled: boolean; readonly periodMs: number },
  modules: readonly ModuleStatusView[],
): ScheduleStatusView {
  const module = modules.find((m) => m.key === schedule.sourceModuleKey);
  return {
    sourceModuleKey: schedule.sourceModuleKey,
    enabled: schedule.enabled,
    periodMs: schedule.periodMs,
    sourceModuleState: module ? module.state : "unknown",
  };
}

export type DeployedEntityStatusView = {
  readonly key: number;
  readonly typeId: string;
  readonly deployed: true;
  readonly note: "No per-entity runtime status is exposed by the firmware for this kind — presence in the last deployed Config is the only observable signal.";
};

export function describeDeployedEntityStatus(entity: { readonly key: number; readonly typeId: string }): DeployedEntityStatusView {
  return {
    key: entity.key,
    typeId: entity.typeId,
    deployed: true,
    note: "No per-entity runtime status is exposed by the firmware for this kind — presence in the last deployed Config is the only observable signal.",
  };
}

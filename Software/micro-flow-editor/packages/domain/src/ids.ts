import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import { err, ok, type Result } from "./result.js";

/**
 * Nominal ("branded") string type: two branded types with a different tag are
 * not mutually assignable even though both are strings at runtime — the
 * compiler rejects passing a `ModuleId` where a `RuleId` is expected. This is
 * the "rejected at the type level" half of S012's dangling-reference
 * requirement; `IdRegistry` (see `id-registry.ts`) is the runtime half.
 *
 * These are *authoring-side* IDs (UUIDs, used inside the app/Project to refer
 * to entities). They are distinct from the deterministic, short "keys" the
 * Config compiler assigns to Module/Rule/Block for the firmware wire format
 * (see REACT_FLOW_ARCHITECTURE.md — "Module/Rule/Block key destinate al
 * firmware sono assegnate deterministicamente"); that is S072's concern, not
 * this file's.
 */
declare const brandTag: unique symbol;
export type Branded<T, Brand extends string> = T & { readonly [brandTag]: Brand };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idFactory<Brand extends string>(brand: Brand) {
  return (raw: string): Result<Branded<string, Brand>, DomainError> => {
    if (!UUID_PATTERN.test(raw)) {
      return err(
        domainError({
          code: DomainErrorCode.INVALID_ID,
          path: [brand],
          target: raw,
          remediation: `Provide a valid UUID for ${brand} instead of "${raw}".`,
        }),
      );
    }
    return ok(raw as Branded<string, Brand>);
  };
}

export type ProjectId = Branded<string, "ProjectId">;
export const projectId = idFactory("ProjectId");

export type CoreBindingId = Branded<string, "CoreBindingId">;
export const coreBindingId = idFactory("CoreBindingId");

export type ModuleId = Branded<string, "ModuleId">;
export const moduleId = idFactory("ModuleId");

export type ProfileId = Branded<string, "ProfileId">;
export const profileId = idFactory("ProfileId");

export type ScheduleId = Branded<string, "ScheduleId">;
export const scheduleId = idFactory("ScheduleId");

export type RuleId = Branded<string, "RuleId">;
export const ruleId = idFactory("RuleId");

export type BlockId = Branded<string, "BlockId">;
export const blockId = idFactory("BlockId");

export type EdgeId = Branded<string, "EdgeId">;
export const edgeId = idFactory("EdgeId");

export type DeploymentId = Branded<string, "DeploymentId">;
export const deploymentId = idFactory("DeploymentId");

export type NodeRedResourceId = Branded<string, "NodeRedResourceId">;
export const nodeRedResourceId = idFactory("NodeRedResourceId");

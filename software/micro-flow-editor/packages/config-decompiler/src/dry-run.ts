import { domainError, type DomainError } from "@spaghettilab/domain";
import { compileConfig, type CanonicalConfig, type CompileConfigInput, type CompileConfigOptions } from "@spaghettilab/config-compiler";
import { isBlockNodeData, isRuleNodeData, type DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { isModuleNodeData, type ModuleNodeData } from "@spaghettilab/physical-composition-model";
import type { GraphNode } from "@spaghettilab/domain";
import { ConfigDecompilerErrorCode } from "./errors.js";

export type DryRunOptions = CompileConfigOptions & {
  /** Device Profile IDs actually installed on the target Core — omit to skip this check entirely (S062/S063 own the real installed-profile list). */
  readonly availableProfileIds?: ReadonlySet<string>;
  /** Block/Rule `typeId`s actually provided by an installed Capability Pack — omit to skip. */
  readonly availableBlockRuleTypeIds?: ReadonlySet<string>;
};

/**
 * Result of a full dry-run (S073 point 2): every error/warning found,
 * never stopping at the first (matching `@spaghettilab/domain`'s
 * `validateProjectV1` precedent, and `compileConfig`'s own collect-all
 * behavior). `compiled` is present only when there are no `"error"`-severity
 * issues — a warnings-only dry-run still produces a usable Config.
 */
export type DryRunResult = {
  readonly compiled?: CanonicalConfig;
  readonly issues: readonly DomainError[];
};

function missingProfileWarning(node: GraphNode<"physical-composition", string, unknown>, profileId: string): DomainError {
  return domainError({
    code: ConfigDecompilerErrorCode.MISSING_PROFILE,
    severity: "warning",
    path: ["config-decompiler", "dry-run", "nodes", node.id],
    target: profileId,
    remediation: `Device Profile "${profileId}" is not installed on the target Core — install it before deploying (S062/S063)`,
  });
}

function missingCapabilityPackWarning(node: GraphNode<"device-processing", string, unknown>, typeId: string): DomainError {
  return domainError({
    code: ConfigDecompilerErrorCode.MISSING_CAPABILITY_PACK,
    severity: "warning",
    path: ["config-decompiler", "dry-run", "nodes", node.id],
    target: typeId,
    remediation: `no installed Capability Pack provides type "${typeId}" — install the pack that provides it before deploying`,
  });
}

/**
 * Runs `compileConfig` (S072) and, independently, checks that every
 * referenced Device Profile / Block-Rule type is actually available —
 * "profilo o pack assente" (S073 point 2) — merging both into one
 * non-fail-fast list. This never calls a remote `VALIDATE_CONFIG`; it is
 * the same local, synchronous, no-network check
 * `S070-processing-graph-editor/backend-behavior.md` describes for
 * "Invia a Dry-run".
 */
export function dryRunConfig(input: CompileConfigInput, options: DryRunOptions = {}): DryRunResult {
  const issues: DomainError[] = [];

  if (options.availableProfileIds) {
    for (const node of input.physicalGraph.nodes as readonly GraphNode<"physical-composition", string, ModuleNodeData>[]) {
      if (!isModuleNodeData(node.data)) continue;
      const profileId = node.data.profileId;
      if (profileId !== undefined && !options.availableProfileIds.has(profileId)) {
        issues.push(missingProfileWarning(node, profileId));
      }
    }
  }

  if (options.availableBlockRuleTypeIds) {
    for (const node of input.processingGraph.nodes as readonly GraphNode<"device-processing", string, DeviceProcessingNodeData>[]) {
      if (isBlockNodeData(node.data) && !options.availableBlockRuleTypeIds.has(node.data.blockTypeId)) {
        issues.push(missingCapabilityPackWarning(node, node.data.blockTypeId));
      }
      if (isRuleNodeData(node.data) && !options.availableBlockRuleTypeIds.has(node.data.ruleTypeId)) {
        issues.push(missingCapabilityPackWarning(node, node.data.ruleTypeId));
      }
    }
  }

  const compileResult = compileConfig(input, options);
  if (!compileResult.ok) {
    issues.push(...compileResult.error);
    return { issues };
  }
  return { compiled: compileResult.value, issues };
}

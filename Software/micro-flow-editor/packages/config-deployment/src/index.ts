export { ConfigDeploymentErrorCode } from "./errors.js";
export { diffConfigs, isConfigDiffEmpty, type ConfigDiff, type SectionDiff } from "./diff.js";
export {
  deployConfig,
  deployToCores,
  DeploymentOutcomeKind,
  type ConfigWireClient,
  type DeploymentContext,
  type DeploymentResult,
} from "./deploy.js";

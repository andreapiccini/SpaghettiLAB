export const ConfigDeploymentErrorCode = {
  PROFILE_OR_PACK_MISSING: "config-deployment.profile_or_pack_missing",
  LOCAL_VALIDATION_FAILED: "config-deployment.local_validation_failed",
  REMOTE_VALIDATION_FAILED: "config-deployment.remote_validation_failed",
  STALE_GENERATION: "config-deployment.stale_generation",
  READBACK_MISMATCH: "config-deployment.readback_mismatch",
  REMOTE_ERROR: "config-deployment.remote_error",
} as const;

export const DeviceProfileInstallErrorCode = {
  MALFORMED_CBOR: "device-profile-install.malformed_cbor",
  UNSUPPORTED_WIRE_VERSION: "device-profile-install.unsupported_wire_version",
  UNKNOWN_OPCODE: "device-profile-install.unknown_opcode",
  REMOTE_VALIDATION_FAILED: "device-profile-install.remote_validation_failed",
  HASH_VERIFICATION_FAILED: "device-profile-install.hash_verification_failed",
  PROFILE_IN_USE: "device-profile-install.profile_in_use",
  NOT_FOUND_AFTER_INSTALL: "device-profile-install.not_found_after_install",
} as const;

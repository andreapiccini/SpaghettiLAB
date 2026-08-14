import type { CanonicalEnergy, CanonicalMqtt } from "@spaghettilab/config-compiler";

/**
 * No screen authors MQTT/connectivity/energy settings yet (that's UI-S120
 * territory) — `compileConfig`/`dryRunConfig`/`deployConfig` all require these
 * fields, so callers that don't yet have a real source for them use this
 * explicit, honestly-disabled default rather than fabricating the project's
 * real settings. Shared by the Processing Graph Editor (Dry-run) and Deploy &
 * Diff so both compute the exact same candidate Config for the same graphs.
 */
export const DISABLED_MQTT: CanonicalMqtt = { enabled: false, host: "", port: 0, baseTopic: "", security: 0, credentialId: 0 };
export const DEFAULT_ENERGY: CanonicalEnergy = { bleAvailability: 0, advertisingWindowMs: 0, advertisingPeriodMs: 0 };

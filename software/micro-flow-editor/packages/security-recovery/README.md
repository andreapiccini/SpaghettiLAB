# @spaghettilab/security-recovery

Security qualification closeout (S124) — target-specific confirmation for every
irreversible action, guided recovery for every documented failure scenario, retention/
purge policy, and an automated threat-test suite.

## Destructive confirmation (`destructive-confirmation.ts`)

Four gates on top of `@spaghettilab/core-admin`'s `checkDestructiveConfirmation()`
(S094) — never a reimplementation of that primitive, only new call sites for it:

- `confirmCredentialRemoval()` — gates `@spaghettilab/domain`'s `CredentialStore.remove()`
  (S121), which had no confirmation of its own.
- `confirmProfileRemoval()` — gates `@spaghettilab/device-profile-install`'s
  `removeProfile()` (S063); that function already hard-blocks a locally-referenced
  profile, this adds the missing confirmation layer for the case it *does* allow.
- `confirmFirmwareDowngrade()` — the explicit override for
  `@spaghettilab/ota-preflight`'s `REJECTED_POSSIBLE_DOWNGRADE` heuristic (S102):
  proceeding past that warning now requires a confirmed, displayed target, never a
  silent bypass.
- `confirmNodeRedResourceDeletion()` — gates dropping a System Automation Link's
  compiled Node-RED nodes before `@spaghettilab/node-red-deploy`'s next
  `reconcileFlows()` removes them.

Every target string is built from **device ID + scope + consequence** in one place
(`describeTarget()`) — S124 § Verifiche: "ogni reset o rimozione mostra device ID,
scope e conseguenze prima della conferma." The displayed target and the confirmed
value are structurally the same string, never two independently-maintained copies.

## Guided recovery (`recovery-guides.ts`)

Pure plan-producing functions for all six named scenarios: Core replaced, device ID
mismatch, Config corrupt/absent, catalog incompatible, OTA rollback, Node-RED
unreachable. Every plan is an ordered list of `{step, destructive}` entries — this
module never performs a step, and no plan's first step is destructive (every one
starts with observation/confirmation). A step that genuinely is destructive is marked
as such so a caller's UI can require the matching `destructive-confirmation.ts` gate
before running it.

## Retention policy (`retention-policy.ts`)

`RETENTION_POLICY` is the one documented answer to "what does logout actually clear":
catalog cache and telemetry buffer, yes; credentials and the audit log, no (explicit
removal only / never purged by this app). `purgeOnLogout()` is the only code path that
executes it — added `CatalogCache.clear()` to `@spaghettilab/core-session` for this
(previously only per-device `invalidateDevice()` existed; logout needs a full clear).

## Threat tests (`__tests__/threat-tests/`)

Automated, passing tests for all five named threats — exercising already-shipped
sandboxing/scrubbing rather than reimplementing anything:

- **XSS**: a static scan across every package's `src/` for `eval(`/`new Function(`/
  `.innerHTML =`/`dangerouslySetInnerHTML` (none found), plus a dynamic check that a
  script-injection payload in a Project name or Device Profile `profileId` survives
  import as inert string data.
- **Malicious profile**: a profile whose own declared ops exceed its declared budget
  is rejected by `@spaghettilab/device-profile-authoring-model`'s
  `validateDeviceProfile()`; a package whose content was tampered with after export is
  rejected by `@spaghettilab/device-profile-package`'s hash check.
- **Oversized import**: Project, Device Profile package and marketplace index imports
  are all rejected before `JSON.parse` runs, at their respective size ceilings.
- **Forged marketplace metadata**: `@spaghettilab/capability-marketplace`'s
  `resolveDependencies()` never resolves an untrusted or unverifiable pack (no
  default-trust fallback), and never resolves a pack whose declared ABI doesn't
  actually match the Core's.
- **Secret leakage**: `findSuspiciousSecretLikeKeys()`/`recordSensitiveOperation()`
  (domain, S121/S123) scrub secret-shaped keys at any depth, including on a failure
  outcome; `@spaghettilab/ota-lifecycle`'s `redactSignedUrl()` strips a signed
  artifact URL's query string before it reaches the audit log.

## Honest scope gaps

- **The static XSS scan only covers this workspace's TypeScript source** — it says
  nothing about `packages/app`'s actual React rendering behavior at runtime (React's
  own default escaping is what actually prevents DOM XSS there; this package doesn't
  re-verify that mechanism).
- **Guided recovery plans are descriptive, not executable** — a caller's UI decides how
  to present/step through them; this package produces the plan, never runs it.
- **`purgeOnLogout()` requires the caller to supply every `CatalogCache`/telemetry-clear
  callback it should purge** — this package has no registry of "every store that
  exists" to iterate automatically.

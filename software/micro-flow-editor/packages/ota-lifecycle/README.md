# @spaghettilab/ota-lifecycle

OTA state machine, postflight verification and audit (S103) — runs a firmware update
so a failure at any point never leaves the Core in a falsely "installed" state.

## A real firmware gap fixed while grounding this task

Firmware commit `875c115` added four real Protocol V1 operations —
`OPEN_BLE_UPDATE`(28), `WRITE_BLE_UPDATE`(29), `FINISH_BLE_UPDATE`(30),
`CANCEL_BLE_UPDATE`(31) (`protocol.h`) — that `@spaghettilab/protocol-sdk` did not
decode at all. Fixed directly in `protocol-sdk` (`operations/ble-update.ts`,
`envelope.ts`'s `Operation` enum, `SpaghettiClient`) as part of this task, since S103
explicitly requires an OTA state machine "per ogni trasporto supportato" and BLE
wasn't reachable at all before this.

## Transport reality (`transport.ts`)

`UpdateTransport` is `enum spaghetti_update_transport` (`update.h:17-22`:
`NONE`/`UART`/`UDP`/`BLE`). **`canResumeAfterDisconnect()` returns `false` for every
transport** — checked directly, not assumed from `WRITE_BLE_UPDATE`'s `offset` field
looking resume-shaped. `spaghetti_update_write()`'s doc comment is explicit: "chunks
must be contiguous", and `-EPERM` when "No transport currently owns a RECEIVING
session" — `offset` is a contiguity/integrity check on an *already-owned* session, not
a seek/resume primitive. A session lost to a disconnect cannot be re-attached; a caller
must arm a fresh session and start from byte 0. Wi-Fi (`UDP`) upload happens over a raw
channel entirely outside the CBOR envelope (`OPEN_WIFI_UPDATE` only returns a handover
address/port), so this SDK has no visibility into its resume behavior either. S103 §
Implementazione point 1's "resume soltanto se il protocollo lo garantisce" resolves to
"never, on this firmware version" — a checked fact, not a guess.

## BLE OTA session (`ble-ota-session.ts`)

`BleOtaSession` is the only OTA transport fully modeled on Protocol V1's CBOR envelope
today (Wi-Fi's actual bytes travel a raw UDP channel this SDK doesn't model). Phases
named to match S103's vocabulary (arm/upload/finalize/pending-reboot/cancel/failed) —
`TRIAL`/`CONFIRMED`/`ROLLED_BACK` are deliberately never phases of this class:
`spaghetti_update_confirm_trial()` is Core-only, never exposed to any transport
(`update.h`), and rollback is MCUboot-automatic. Both are only ever *observed*,
post-reboot over a fresh connection, by `postflight.ts`.

`arm()` refuses to open a wire session at all unless the caller-supplied
`@spaghettilab/ota-preflight` `PreflightResult` is `READY` — S103 § Verifiche's "la
rimozione di una feature in uso è rifiutata prima di avviare l'OTA" holds
architecturally here, not only inside `preflightOtaCandidate()` itself: this class has
no code path that can reach `openBleUpdate` with a non-`READY` result.

`writeChunk()` checks the expected contiguous offset **locally** before ever calling
the wire — refusing an out-of-order write instead of spending a call that
`spaghetti_update_write()` would reject anyway. Any wire failure (simulated disconnect,
hash mismatch at finish, ...) moves the session to `FAILED`, never `PENDING_REBOOT` —
there is no code path that marks a failed step as having succeeded.

## Postflight (`postflight.ts`)

`evaluatePostflight()` compares a `PostflightSnapshot` taken before arming against one
taken after a reboot is observed (both built by the caller from real wire reads — this
package does no I/O), covering S103 § Implementazione point 2's full list: device ID,
firmware version, feature-set hash, pack list (via `packIds`), Config/profile
preservation (`configPreserved`/`profilesPreserved`, computed by the caller with
`@spaghettilab/config-deployment`'s diff tools and a Device Profile catalog compare —
not derivable from CBOR fields alone), and catalog fingerprint (fed into
`catalog-invalidation.ts`).

Checks run in a fixed order: device identity first (a mismatch means "wrong Core,"
everything else is meaningless) — then **rollback detection**: if the post-OTA version
still equals the *pre*-OTA version, that's `ROLLBACK_DETECTED`, not a failure to
investigate further, since this package never calls a "confirm" operation (none is
exposed to any transport) — then version, feature-set hash, **resource report**
(`resourceReport.flashImageBudgetBytes`/`staticRamBudgetBytes` from a post-reboot
`GET_RESOURCES` must match the candidate's declared budget — confirms the image that
actually booted is the one that was transferred, not just that *some* new image
booted), then Config/profile mismatches. "un fallimento OTA/rollback non produce mai
uno stato 'installato' falso" (S103 § Fine task) is this function's entire reason to
exist: `CONFIRMED_INSTALLED` is reachable only when every one of these checks passes,
in order.

## Catalog invalidation (`catalog-invalidation.ts`)

`invalidateCatalogAfterOta()` reuses `@spaghettilab/core-session`'s existing
`CatalogCache.invalidateDevice()` (S030 point 4) — no new cache logic, just wiring a
postflight result to the invalidation call that already exists for exactly this. Runs
for every outcome except `WRONG_DEVICE` — a detected rollback still changed what the
device reports, so its cache is invalidated too, not only a confirmed install.

## Audit (`audit.ts`)

`recordOtaAudit()` wraps `@spaghettilab/domain`'s `recordSensitiveOperation()` under
the `"core.ota"` category (already in `AUDIT_OPERATIONS` since S123). Its shared
`SECRET_LIKE_KEY_PATTERN` scrubber matches `/secret|password|token|api[_-]?key|
private[_-]?key/i` — **not** a plain `url`/`artifactUrl` key, so a signed artifact URL
(an expiring access token embedded as a query parameter) would pass through unscrubbed.
`redactSignedUrl()` strips everything after the path before `detail.artifactUrl` ever
reaches the shared scrubber — S103 § Implementazione point 4's "senza... URL firmati
sensibili" needed its own redaction on top, not a change to the shared pattern (reused
broadly elsewhere; over-matching there would be a bigger blast radius than this one call
site needs).

## Honest scope gaps

- **No resume, on any transport, on this firmware version** — see `transport.ts` above.
- **Wi-Fi/UDP OTA byte transfer is entirely out of this SDK's scope** — only the
  `OPEN_WIFI_UPDATE` handover is modeled (in `protocol-sdk`); the actual upload
  protocol over the returned address/port is not CBOR-envelope Protocol V1 at all.
- **Config/profile preservation must be caller-computed** — this package has no Config
  or Device Profile diffing of its own; it only consumes two booleans.
- **`spaghetti_update_confirm_trial()`/rollback are never called or triggered by this
  package** — both are firmware-internal; this package only observes their effect
  post-reboot.

# @spaghettilab/config-deployment

Transactional Config deploy (S080): compile → local dry-run (hard-blocking on missing
Device Profile/Capability Pack) → remote validate → compare-and-swap apply → read-back
verify, with a semantic diff and structured, non-destructive conflict handling. Built on
`@spaghettilab/config-compiler` (S072) and `@spaghettilab/config-decompiler` (S073).

## Pipeline (`deploy.ts`)

`deployConfig()` runs the exact sequence S080 point 1 asks for:

1. **Local dry-run** (`dryRunConfig`, S073) — but stricter than that function's own
   default: a missing Device Profile or Capability Pack is treated as a hard blocker
   here (`PROFILE_OR_PACK_MISSING`), not a warning, matching S080 point 3 ("blocca
   deploy se profili o Capability Pack richiesti non sono installati"). The candidate
   is never sent anywhere in this case.
2. **Remote `VALIDATE_CONFIG`** — a real rejection (not the always-`valid:1` stub
   `@spaghettilab/device-profile-install` documents for the *Device Profile* validate
   op; Config's own validate is real, see S072's README) fails the deploy before
   anything is applied.
3. **`APPLY_CONFIG` with compare-and-swap** — `expectedGeneration` is always sent
   (S080 point 4: "usa sempre expected generation/hash"). A `CONFLICT` status
   (`-ESTALE`/`-EEXIST`, the same errno→status mapping
   `@spaghettilab/device-profile-install` uses) re-fetches the live Config, decodes it
   (S073), and returns it alongside a semantic diff against the candidate —
   **never** force-applies or picks a winner. "Import live / rebase / annulla" is left
   entirely to the caller (S080 point 4: "niente force/last-write-wins V1").
4. **Read-back verify** — a successful `changed: true` apply is not trusted on its own;
   this function always follows up with `GET_CONFIG` and only returns `SUCCESS` (and
   only then builds a `DeploymentRecordV1`) if the read-back generation and SHA-256
   both match what was just applied (S080 point 5).

## Ambiguous outcomes (lost response, reboot mid-apply)

If `applyConfig` itself throws for any reason other than a `CONFLICT` status (a
dropped connection, a timeout, a reboot mid-request), this function never assumes
either outcome — it queries `GET_CONFIG` and compares the returned SHA-256 against
the candidate's own hash computed locally: a match means the apply actually landed
(`AMBIGUOUS_RESOLVED_APPLIED`, with a `DeploymentRecordV1` built from the live
generation/hash); a mismatch means it didn't (`AMBIGUOUS_RESOLVED_NOT_APPLIED`, safe
to retry). This is the Config-hash half of S080 point 6/§ Verifiche's "reboot durante
apply viene riconciliato da boot ID + Config hash" — the boot-ID half is
`@spaghettilab/core-session`'s job (S030), not duplicated here; a caller combining
both gets the full picture.

## Diff (`diff.ts`)

`diffConfigs()` compares two `CanonicalConfig`s section by section
(Module/Schedule/Rule/Block/edge, plus a `policyChanged` flag for mqtt/connectivity/
energy) — never authoring metadata, because `CanonicalConfig` structurally cannot
carry any (S080 point 2). Identity is the same key `compileConfig` assigns
(`key` for Module/Rule/Block, `sourceKey` for Schedule); an edge has no single
identity field on the wire, so it's compared by its full tuple — any field change is
a different edge (added/removed only, never "changed").

## Multi-Core (`deployToCores`)

Runs `deployConfig` against several Cores independently, each isolated in its own
`try`/`catch` — S080 point 8: "operazioni indipendenti con report parziale." A
failure on one target is reported only for that target; every other target's result
is returned exactly as if the failing one didn't exist. V1 makes no atomic
multi-Core guarantee, matching the task text explicitly.

## Honest scope gaps

- **No automatic conflict resolution.** `STALE_GENERATION` always hands the live
  Config and a diff back to the caller; this package never merges, rebases, or picks
  a side.
- **Boot-ID-based reboot detection is not this package's job** — `@spaghettilab/core-session`
  already tracks it (S030); this package only does the Config-hash half of
  reconciliation described above.
- **No `DeploymentRecordV1` persistence.** This package produces the record; writing
  it into `ProjectV1.deploymentRecords` is the caller's job (via S014's `CommandStack`,
  like every other `ProjectV1` mutation).

import { PERMISSION_SCOPES, type PermissionSet } from "@spaghettilab/domain";

/**
 * `@spaghettilab/domain`'s `PermissionSet` has no real source anywhere in
 * this app yet — there is no login/auth/multi-principal system (that is
 * `ecosystem-access-v1`/UI-S120 territory, still all gaps). Defaulting to
 * an *empty* set would make every gated action on this screen (Comandi,
 * Discovery invasive scan, every Amministrazione row) permanently disabled
 * and unverifiable. Defaulting to *all scopes granted* keeps the screen
 * usable and its real gating logic (`checkPermission`/
 * `checkDestructiveConfirmation`) exercised, at the cost of not reflecting
 * any actual access control — this is a temporary, explicitly-documented
 * placeholder, to be replaced wholesale once UI-S120 introduces a real
 * `PermissionSet` source.
 */
export const PLACEHOLDER_GRANTED_ALL: PermissionSet = new Set(PERMISSION_SCOPES);

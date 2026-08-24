import type { CoreBindingId } from "@spaghettilab/domain";
import { involvedCoreBindings, type SystemAutomationLink } from "./link.js";

export const LinkValidity = {
  VALID: "VALID",
  STALE: "STALE",
} as const;

export type LinkValidityKind = (typeof LinkValidity)[keyof typeof LinkValidity];

export type LinkValidityResult = {
  readonly kind: LinkValidityKind;
  readonly staleCoreBindings: readonly CoreBindingId[];
};

/**
 * "un catalog change su un Core coinvolto rende stale i link finché non
 * vengono rivalidati" (S111 § Verifiche). `currentFingerprints` is the
 * caller's freshest read of each involved Core's catalog fingerprint
 * (`GET_CATALOG`'s `fingerprint`, already the real change signal
 * `@spaghettilab/core-session`'s `CatalogCache` keys on) — any CoreBinding
 * whose current fingerprint no longer matches what the link was last
 * validated against makes the whole link `STALE`, listing every CoreBinding
 * responsible so a caller can show which side changed.
 */
export function revalidateLink(link: SystemAutomationLink, currentFingerprints: ReadonlyMap<string, string>): LinkValidityResult {
  const involved = involvedCoreBindings(link.source, link.target);
  const stale = involved.filter((coreBinding) => {
    const current = currentFingerprints.get(coreBinding);
    const validated = link.validatedFingerprints.get(coreBinding);
    return current === undefined || validated === undefined || current !== validated;
  });
  return stale.length > 0 ? { kind: LinkValidity.STALE, staleCoreBindings: stale } : { kind: LinkValidity.VALID, staleCoreBindings: [] };
}

/** Returns a copy of `link` with `validatedFingerprints` refreshed to `currentFingerprints` — the only way a `STALE` link becomes `VALID` again, and only for the CoreBindings actually re-checked. */
export function markLinkRevalidated(link: SystemAutomationLink, currentFingerprints: ReadonlyMap<string, string>): SystemAutomationLink {
  const involved = involvedCoreBindings(link.source, link.target);
  const updated = new Map(link.validatedFingerprints);
  for (const coreBinding of involved) {
    const current = currentFingerprints.get(coreBinding);
    if (current !== undefined) updated.set(coreBinding, current);
  }
  return { ...link, validatedFingerprints: updated };
}

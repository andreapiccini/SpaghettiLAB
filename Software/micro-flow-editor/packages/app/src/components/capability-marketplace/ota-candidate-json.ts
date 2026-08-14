import type { OtaCandidateManifest } from "@spaghettilab/ota-preflight";

/**
 * `@spaghettilab/ota-preflight` has no JSON parser for `OtaCandidateManifest`
 * (unlike `@spaghettilab/capability-marketplace`'s validated
 * `parseMarketplaceIndexJson`) — this is a UI-only, minimal shape check over
 * caller-supplied JSON, not a hardened parser. It validates the fields this
 * type actually needs and converts `providedTypeIds` (a JSON array) into the
 * `ReadonlySet<string>` the type declares; it never invents a value for a
 * missing field.
 */
export function parseOtaCandidateManifestJson(text: string): { readonly ok: true; readonly value: OtaCandidateManifest } | { readonly ok: false; readonly error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (cause) {
    return { ok: false, error: `JSON non valido: ${cause instanceof Error ? cause.message : String(cause)}` };
  }
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Il manifest deve essere un oggetto JSON" };
  const r = raw as Record<string, unknown>;

  const requiredStrings = ["coreVariant", "fwVersion", "featureSetHash", "bootloaderMin", "hash"] as const;
  for (const key of requiredStrings) {
    if (typeof r[key] !== "string") return { ok: false, error: `Campo mancante o non testuale: ${key}` };
  }
  const requiredNumbers = [
    "resourceProfile",
    "abiVersion",
    "minProtocolVersion",
    "minConfigVersion",
    "flashSlotBytes",
    "flashImageBudgetBytes",
    "flashHeadroomBytes",
    "staticRamBudgetBytes",
    "declaredStackBytes",
    "declaredPoolBytes",
    "declaredWorkspaceBytes",
    "configMigrationPolicy",
  ] as const;
  for (const key of requiredNumbers) {
    if (typeof r[key] !== "number") return { ok: false, error: `Campo mancante o non numerico: ${key}` };
  }
  if (!Array.isArray(r.packs)) return { ok: false, error: "Campo mancante o non array: packs" };
  if (!Array.isArray(r.providedTypeIds)) return { ok: false, error: "Campo mancante o non array: providedTypeIds" };
  if (typeof r.artifact !== "object" || r.artifact === null) return { ok: false, error: "Campo mancante o non oggetto: artifact" };
  if (typeof r.signature !== "object" || r.signature === null) return { ok: false, error: "Campo mancante o non oggetto: signature" };
  if (typeof r.isAllSupportedBuild !== "boolean") return { ok: false, error: "Campo mancante o non booleano: isAllSupportedBuild" };

  const value: OtaCandidateManifest = {
    coreVariant: r.coreVariant as string,
    resourceProfile: r.resourceProfile as number,
    fwVersion: r.fwVersion as string,
    abiVersion: r.abiVersion as number,
    minProtocolVersion: r.minProtocolVersion as number,
    minConfigVersion: r.minConfigVersion as number,
    packs: r.packs as OtaCandidateManifest["packs"],
    featureSetHash: r.featureSetHash as string,
    flashSlotBytes: r.flashSlotBytes as number,
    flashImageBudgetBytes: r.flashImageBudgetBytes as number,
    flashHeadroomBytes: r.flashHeadroomBytes as number,
    staticRamBudgetBytes: r.staticRamBudgetBytes as number,
    declaredStackBytes: r.declaredStackBytes as number,
    declaredPoolBytes: r.declaredPoolBytes as number,
    declaredWorkspaceBytes: r.declaredWorkspaceBytes as number,
    bootloaderMin: r.bootloaderMin as string,
    configMigrationPolicy: r.configMigrationPolicy as OtaCandidateManifest["configMigrationPolicy"],
    artifact: r.artifact as OtaCandidateManifest["artifact"],
    hash: r.hash as string,
    signature: r.signature as OtaCandidateManifest["signature"],
    providedTypeIds: new Set(r.providedTypeIds as string[]),
    isAllSupportedBuild: r.isAllSupportedBuild as boolean,
  };
  return { ok: true, value };
}

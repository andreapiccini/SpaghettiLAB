import type { GetCatalogResponse } from "@spaghettilab/protocol-sdk";

export type ModuleDriverEntry = {
  readonly typeId: string;
  readonly commandCount: number;
};

export type CatalogIndex = {
  readonly fingerprint: Uint8Array;
  /** Deduplicated, sorted by `typeId` — never depends on page read order. */
  readonly moduleDrivers: readonly ModuleDriverEntry[];
  /** False when the pages given stop short of a full pagination (S030's `getFullCatalog()` reached its cursor loop's end) — an interrupted read must never look like a complete one. */
  readonly complete: boolean;
};

/**
 * Normalizes raw `GET_CATALOG` pages (S021/S030) into an immutable, order-
 * independent index. Only Module Driver entries are normalized here — the
 * wire protocol as currently implemented has no separate Rule/Block/opcode/
 * operation/schema/field/command listing to normalize (S021's research note:
 * every operation's schema descriptor is unpopulated,
 * `.fields = NULL, .field_count = 0`). Building empty placeholder indices for
 * those would just be speculative code with no real data behind it; this
 * module normalizes what the protocol actually exposes today.
 */
export function normalizeCatalogPages(pages: readonly GetCatalogResponse[], complete: boolean): CatalogIndex {
  if (pages.length === 0) {
    return { fingerprint: new Uint8Array(0), moduleDrivers: [], complete };
  }
  const fingerprint = pages[0]!.fingerprint;
  const byTypeId = new Map<string, ModuleDriverEntry>();
  for (const page of pages) {
    for (const driver of page.drivers) {
      byTypeId.set(driver.typeId, driver);
    }
  }
  const moduleDrivers = [...byTypeId.values()].sort((a, b) =>
    a.typeId < b.typeId ? -1 : a.typeId > b.typeId ? 1 : 0,
  );
  return { fingerprint, moduleDrivers, complete };
}

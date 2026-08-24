import type { CanonicalBlock, CanonicalConfig, CanonicalEdge, CanonicalModule, CanonicalRule, CanonicalSchedule } from "@spaghettilab/config-compiler";

export type SectionDiff<T> = {
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly changed: readonly { readonly before: T; readonly after: T }[];
};

/**
 * Semantic diff between two compiled Configs — never authoring metadata,
 * because `CanonicalConfig` structurally cannot carry any (S080 point 2:
 * "ignora metadata authoring"). Identity is the same key `compileConfig`
 * assigns (`key` for Module/Rule/Block, `sourceKey` for Schedule); an edge
 * has no single identity field on the wire, so it's compared by its full
 * tuple — any field change is a different edge, added/removed only, never
 * "changed".
 */
export type ConfigDiff = {
  readonly modules: SectionDiff<CanonicalModule>;
  readonly schedules: SectionDiff<CanonicalSchedule>;
  readonly rules: SectionDiff<CanonicalRule>;
  readonly blocks: SectionDiff<CanonicalBlock>;
  readonly edges: SectionDiff<CanonicalEdge>;
  readonly policyChanged: boolean;
};

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? `${v.toString()}n` : v));
}

function diffByKey<T>(before: readonly T[], after: readonly T[], keyOf: (item: T) => number): SectionDiff<T> {
  const beforeByKey = new Map(before.map((item) => [keyOf(item), item]));
  const afterByKey = new Map(after.map((item) => [keyOf(item), item]));
  const added: T[] = [];
  const removed: T[] = [];
  const changed: { before: T; after: T }[] = [];

  for (const [key, afterItem] of afterByKey) {
    const beforeItem = beforeByKey.get(key);
    if (beforeItem === undefined) {
      added.push(afterItem);
    } else if (stableStringify(beforeItem) !== stableStringify(afterItem)) {
      changed.push({ before: beforeItem, after: afterItem });
    }
  }
  for (const [key, beforeItem] of beforeByKey) {
    if (!afterByKey.has(key)) removed.push(beforeItem);
  }
  return { added, removed, changed };
}

function diffEdges(before: readonly CanonicalEdge[], after: readonly CanonicalEdge[]): SectionDiff<CanonicalEdge> {
  const identity = (e: CanonicalEdge) => `${e.sourceKind}:${e.sourceKey}:${e.sourcePortOrField}:${e.targetKey}:${e.targetInput}`;
  const beforeSet = new Map(before.map((e) => [identity(e), e]));
  const afterSet = new Map(after.map((e) => [identity(e), e]));
  const added = [...afterSet.entries()].filter(([id]) => !beforeSet.has(id)).map(([, e]) => e);
  const removed = [...beforeSet.entries()].filter(([id]) => !afterSet.has(id)).map(([, e]) => e);
  return { added, removed, changed: [] };
}

export function diffConfigs(before: CanonicalConfig, after: CanonicalConfig): ConfigDiff {
  return {
    modules: diffByKey(before.modules, after.modules, (m) => m.key),
    schedules: diffByKey(before.schedules, after.schedules, (s) => s.sourceKey),
    rules: diffByKey(before.rules, after.rules, (r) => r.key),
    blocks: diffByKey(before.blocks, after.blocks, (b) => b.key),
    edges: diffEdges(before.edges, after.edges),
    policyChanged:
      stableStringify(before.mqtt) !== stableStringify(after.mqtt) ||
      before.connectivity !== after.connectivity ||
      stableStringify(before.energy) !== stableStringify(after.energy),
  };
}

export function isConfigDiffEmpty(diff: ConfigDiff): boolean {
  const sections = [diff.modules, diff.schedules, diff.rules, diff.blocks, diff.edges];
  return !diff.policyChanged && sections.every((s) => s.added.length === 0 && s.removed.length === 0 && s.changed.length === 0);
}

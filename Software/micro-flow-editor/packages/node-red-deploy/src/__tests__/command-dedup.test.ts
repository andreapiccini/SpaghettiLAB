import { describe, expect, it } from "vitest";
import { CommandDedupeTracker } from "../command-dedup.js";

describe("CommandDedupeTracker — S113 § Verifiche (a duplicate/retried record never duplicates the command)", () => {
  it("routes the first occurrence of a (linkId, sourceKey, sequence)", () => {
    const tracker = new CommandDedupeTracker();
    expect(tracker.shouldRoute("link-1", 10, 1)).toBe(true);
  });

  it("refuses a duplicate of the exact same record", () => {
    const tracker = new CommandDedupeTracker();
    tracker.shouldRoute("link-1", 10, 1);
    expect(tracker.shouldRoute("link-1", 10, 1)).toBe(false);
  });

  it("treats the same (sourceKey, sequence) on a different link as independent", () => {
    const tracker = new CommandDedupeTracker();
    tracker.shouldRoute("link-1", 10, 1);
    expect(tracker.shouldRoute("link-2", 10, 1)).toBe(true);
  });

  it("evicts the oldest entry once capacity is exceeded, bounding memory", () => {
    const tracker = new CommandDedupeTracker(2);
    tracker.shouldRoute("link-1", 1, 1);
    tracker.shouldRoute("link-1", 1, 2);
    tracker.shouldRoute("link-1", 1, 3);
    expect(tracker.size).toBe(2);
  });
});

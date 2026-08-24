import { describe, expect, it } from "vitest";
import { LinkDiagnosticsTracker } from "../link-diagnostics.js";

describe("LinkDiagnosticsTracker — S113 point 5 (runtime status end-to-end)", () => {
  it("starts every link disconnected with zero counts", () => {
    const tracker = new LinkDiagnosticsTracker();
    expect(tracker.snapshot("link-1")).toEqual({ linkId: "link-1", sourceConnected: false, targetConnected: false, recordCount: 0, commandCount: 0, duplicateRecordCount: 0 });
  });

  it("tracks source/target connectivity independently per link", () => {
    const tracker = new LinkDiagnosticsTracker();
    tracker.setSourceConnected("link-1", true);
    expect(tracker.snapshot("link-1").sourceConnected).toBe(true);
    expect(tracker.snapshot("link-1").targetConnected).toBe(false);
  });

  it("counts records and duplicates separately", () => {
    const tracker = new LinkDiagnosticsTracker();
    tracker.recordReceived("link-1", 1, 1000, false);
    tracker.recordReceived("link-1", 1, 1001, true);
    const snap = tracker.snapshot("link-1");
    expect(snap.recordCount).toBe(1);
    expect(snap.duplicateRecordCount).toBe(1);
    expect(snap.lastRecordSequence).toBe(1);
  });

  it("records the last command outcome and count", () => {
    const tracker = new LinkDiagnosticsTracker();
    tracker.commandRouted("link-1", "SUCCESS", 2000);
    const snap = tracker.snapshot("link-1");
    expect(snap.lastCommandOutcome).toBe("SUCCESS");
    expect(snap.commandCount).toBe(1);
  });

  it("keeps a Core going offline on one link from affecting another link's diagnostics", () => {
    const tracker = new LinkDiagnosticsTracker();
    tracker.setSourceConnected("link-1", true);
    tracker.setSourceConnected("link-2", true);
    tracker.setSourceConnected("link-1", false);
    expect(tracker.snapshot("link-1").sourceConnected).toBe(false);
    expect(tracker.snapshot("link-2").sourceConnected).toBe(true);
  });

  it("allSnapshots lists every tracked link", () => {
    const tracker = new LinkDiagnosticsTracker();
    tracker.setSourceConnected("link-1", true);
    tracker.setSourceConnected("link-2", true);
    expect(tracker.allSnapshots().map((s) => s.linkId).sort()).toEqual(["link-1", "link-2"]);
  });
});

import { describe, expect, it } from "vitest";
import { compileSystemAutomationFlow } from "../flow-compiler.js";
import { CORE_A, CORE_B, linkFixture } from "./fixtures.js";

const profileMap = new Map([
  [CORE_A, "profile-a"],
  [CORE_B, "profile-b"],
]);

describe("compileSystemAutomationFlow", () => {
  it("compiles one record-source -> coordinator -> command-target chain per link, all tagged with project ownership", () => {
    const flow = compileSystemAutomationFlow([linkFixture()], "project-1", profileMap);

    const byType = new Map(flow.nodes.map((n) => [n.type, n]));
    expect(byType.has("spaghetti-record-source")).toBe(true);
    expect(byType.has("spaghetti-coordinator")).toBe(true);
    expect(byType.has("spaghetti-command-target")).toBe(true);
    for (const node of flow.nodes) {
      expect(node.spaghettiOwned).toBe(true);
      expect(node.spaghettiProjectId).toBe("project-1");
    }
  });

  it("wires record source -> coordinator -> command target in sequence", () => {
    const flow = compileSystemAutomationFlow([linkFixture()], "project-1", profileMap);
    const recordSource = flow.nodes.find((n) => n.type === "spaghetti-record-source")!;
    const coordinator = flow.nodes.find((n) => n.type === "spaghetti-coordinator")!;
    expect(recordSource.wires).toEqual([[coordinator.id]]);
  });

  it("credentials are referenced, never inlined — connection nodes only carry a connectionProfileId", () => {
    const flow = compileSystemAutomationFlow([linkFixture()], "project-1", profileMap);
    const connections = flow.nodes.filter((n) => n.type === "spaghetti-connection");
    expect(connections).toHaveLength(2);
    for (const c of connections) {
      expect(typeof c.connectionProfileId).toBe("string");
      expect(JSON.stringify(c)).not.toMatch(/password|secret|token/i);
    }
  });

  it("produces stable node IDs across repeated compiles of the same links", () => {
    const first = compileSystemAutomationFlow([linkFixture()], "project-1", profileMap);
    const second = compileSystemAutomationFlow([linkFixture()], "project-1", profileMap);
    expect(first.nodes.map((n) => n.id)).toEqual(second.nodes.map((n) => n.id));
    expect(first.tabId).toBe(second.tabId);
  });

  it("shares one connection node per distinct CoreBinding across multiple links", () => {
    const flow = compileSystemAutomationFlow(
      [linkFixture({ id: "link-1" }), linkFixture({ id: "link-2", source: { kind: "record-field", coreBinding: CORE_A, sourceKey: 2, schemaId: "sensor.other", schemaVersion: 1, fieldId: 0 } })],
      "project-1",
      profileMap,
    );
    const connections = flow.nodes.filter((n) => n.type === "spaghetti-connection");
    expect(connections).toHaveLength(2);
  });

  it("skips a link whose source/target aren't a record-field/command pair (e.g. a Node-RED processing endpoint)", () => {
    const link = linkFixture({ target: { kind: "nodered", nodeRedResourceId: "33333333-3333-4333-8333-333333333333" as never } });
    const flow = compileSystemAutomationFlow([link], "project-1", profileMap);
    expect(flow.nodes.some((n) => n.type === "spaghetti-record-source")).toBe(false);
  });
});

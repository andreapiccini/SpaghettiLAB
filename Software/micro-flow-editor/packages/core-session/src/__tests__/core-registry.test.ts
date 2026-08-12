import { describe, expect, it } from "vitest";
import { coreBindingId, type CoreBindingRecord } from "@spaghettilab/domain";
import { EventStream, FakeTransport, SpaghettiClient, fakeStatusEvent } from "@spaghettilab/protocol-sdk";
import { CoreRegistry } from "../core-registry.js";

function bindingFor(deviceIdHex: string, index: number): CoreBindingRecord {
  const id = coreBindingId(`cccccccc-0000-4000-8000-00000000000${index}`);
  if (!id.ok) throw new Error("bad fixture id");
  return { bindingId: id.value, expectedDeviceId: deviceIdHex, connectionProfileId: "profile-1" };
}

describe("CoreRegistry", () => {
  it("adds, retrieves and lists sessions independently", () => {
    const registry = new CoreRegistry();
    const transportA = new FakeTransport();
    const clientA = new SpaghettiClient(transportA);
    const sessionA = registry.addSession(bindingFor("aa", 1), clientA, new EventStream(transportA));

    const transportB = new FakeTransport();
    const clientB = new SpaghettiClient(transportB);
    const sessionB = registry.addSession(bindingFor("bb", 2), clientB, new EventStream(transportB));

    expect(registry.get(sessionA.binding.bindingId)).toBe(sessionA);
    expect(registry.get(sessionB.binding.bindingId)).toBe(sessionB);
    expect(registry.list()).toHaveLength(2);
  });

  it("a failure connecting one Core does not affect another's state (error isolation)", async () => {
    const registry = new CoreRegistry();

    // Core A: never answers -> connect() will time out / stay non-READY.
    const transportA = new FakeTransport();
    const clientA = new SpaghettiClient(transportA, { defaultTimeoutMs: 50, attemptTimeoutMs: 50, maxRetries: 0 });
    const sessionA = registry.addSession(bindingFor("aa", 1), clientA, new EventStream(transportA));

    // Core B: answers normally -> reaches READY... (only through GET_STATUS/
    // GET_CAPABILITIES/GET_FEATURES for this isolation check, we just assert
    // it independently starts moving through the state machine).
    const transportB = new FakeTransport();
    const clientB = new SpaghettiClient(transportB, { defaultTimeoutMs: 5000, attemptTimeoutMs: 5000 });
    const sessionB = registry.addSession(bindingFor("bb", 2), clientB, new EventStream(transportB));
    transportB.deliverEvent(fakeStatusEvent(1, 1n));

    const failingConnect = sessionA.connect().catch(() => "failed" as const);
    const bConnectStarted = sessionB.connect();
    bConnectStarted.catch(() => {}); // B is expected to hang too (no responder wired) — only state transition matters here

    await Promise.resolve();
    expect(sessionA.state).toBe("SYNCHRONIZING");
    expect(sessionB.state).toBe("SYNCHRONIZING");

    const outcome = await failingConnect;
    expect(outcome).toBe("failed");
    // B's state must be unaffected by A's failure.
    expect(sessionB.state).toBe("SYNCHRONIZING");

    registry.disposeAll();
  });

  it("removeSession disposes and forgets only the targeted session", () => {
    const registry = new CoreRegistry();
    const transportA = new FakeTransport();
    const sessionA = registry.addSession(bindingFor("aa", 1), new SpaghettiClient(transportA), new EventStream(transportA));
    const transportB = new FakeTransport();
    const sessionB = registry.addSession(bindingFor("bb", 2), new SpaghettiClient(transportB), new EventStream(transportB));

    registry.removeSession(sessionA.binding.bindingId);

    expect(registry.get(sessionA.binding.bindingId)).toBeUndefined();
    expect(registry.get(sessionB.binding.bindingId)).toBe(sessionB);
  });
});

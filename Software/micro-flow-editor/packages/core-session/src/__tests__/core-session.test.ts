import { describe, expect, it } from "vitest";
import {
  canonicalProjectHash,
  coreBindingId,
  createEmptyProject,
  deploymentId,
  projectId,
  type CoreBindingRecord,
  type ProjectV1,
} from "@spaghettilab/domain";
import {
  decodeRequest,
  encodeGetCapabilitiesResponse,
  encodeGetCatalogResponse,
  encodeGetConfigResponse,
  encodeGetFeaturesResponse,
  encodeGetResourcesResponse,
  encodeGetStatusResponse,
  encodeGetTopologyResponse,
  encodeResponse,
  EventStream,
  FakeTransport,
  Operation,
  ProtocolStatus,
  SpaghettiClient,
  fakeStatusEvent,
  type GetCapabilitiesResponse,
  type GetCatalogResponse,
  type GetConfigResponse,
  type GetFeaturesResponse,
  type GetResourcesResponse,
  type GetStatusResponse,
  type GetTopologyResponse,
} from "@spaghettilab/protocol-sdk";
import { CatalogCache } from "../catalog-cache.js";
import { CoreSession } from "../core-session.js";
import { bytesToHex } from "../hex.js";

const DEVICE_ID = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]);
const BINDING_ID = coreBindingId("cccccccc-0000-4000-8000-000000000001");
if (!BINDING_ID.ok) throw new Error("bad fixture id");

const STATUS: GetStatusResponse = {
  state: 1,
  mode: 1,
  imageState: 0,
  activeSlot: 0,
  imageConfirmed: true,
  version: "1.0.0",
  portCount: 1,
  lastResetCause: 0,
  healthState: 1,
  modules: [],
};
const CAPABILITIES: GetCapabilitiesResponse = {
  resourceProfile: 1,
  buildCapabilities: 0,
  coreVariant: "core-v2",
  maxProtocolPayload: 2048,
  maxInflightRequests: 8,
  replayWindowMs: 30000,
  maxModules: 16,
  maxPrincipals: 4,
};
const FEATURES: GetFeaturesResponse = { featureSetHash: new Uint8Array(4).fill(9), packs: [] };
const TOPOLOGY: GetTopologyResponse = { flows: [], nextCursor: 0 };
const RESOURCES: GetResourcesResponse = {
  featureSetHash: new Uint8Array(4).fill(9),
  modules: { capacity: 10, used: 1, peak: 1 },
  rules: { capacity: 10, used: 0, peak: 0 },
  blocks: { capacity: 10, used: 0, peak: 0 },
  profiles: { capacity: 10, used: 0, peak: 0 },
  records: { capacity: 10, used: 0, peak: 0 },
  workspace: { capacity: 10, used: 0, peak: 0 },
  allocationFailures: 0,
  flashSlotBytes: 1048576,
  flashImageBudgetBytes: 786432,
  flashHeadroomBytes: 262144,
  staticRamBudgetBytes: 65536,
};

function fakeCatalog(fingerprintByte: number): GetCatalogResponse {
  return {
    protocolVersion: 1,
    configVersion: 5,
    fingerprint: new Uint8Array(32).fill(fingerprintByte),
    drivers: [{ typeId: "driver-a", commandCount: 1 }],
    nextCursor: 0,
    driverCount: 1,
  };
}

function fakeConfig(hashByte: number): GetConfigResponse {
  return { generation: 1, sha256: new Uint8Array(32).fill(hashByte), configBytes: new Uint8Array([0xa0]) };
}

/** Drains `transport.sent`, answering every not-yet-answered request via the given per-operation responder. */
class FakeCoreResponder {
  private readonly answered = new Set<number>();

  constructor(
    private readonly transport: FakeTransport,
    private readonly handlers: Partial<Record<Operation, () => Uint8Array>>,
  ) {}

  drain(): void {
    for (const bytes of this.transport.sent) {
      const request = decodeRequest(bytes);
      if (this.answered.has(request.correlationId)) continue;
      const handler = this.handlers[request.operation];
      if (!handler) continue;
      this.answered.add(request.correlationId);
      this.transport.deliverResponse(
        encodeResponse({ correlationId: request.correlationId, status: ProtocolStatus.OK, payload: handler() }),
      );
    }
  }
}

/** Runs `work()`, repeatedly flushing microtasks and re-draining the responder until it settles. */
async function runToCompletion(work: () => Promise<void>, responder: FakeCoreResponder): Promise<void> {
  const done = work().catch((e: unknown) => {
    throw e;
  });
  let settled = false;
  void done.then(
    () => (settled = true),
    () => (settled = true),
  );
  for (let i = 0; i < 2000 && !settled; i++) {
    await Promise.resolve();
    responder.drain();
  }
  await done;
}

const FULL_HANDLERS = (catalogFingerprintByte: number, configHashByte: number): Partial<Record<Operation, () => Uint8Array>> => ({
  [Operation.GET_STATUS]: () => encodeGetStatusResponse(STATUS),
  [Operation.GET_CAPABILITIES]: () => encodeGetCapabilitiesResponse(CAPABILITIES),
  [Operation.GET_FEATURES]: () => encodeGetFeaturesResponse(FEATURES),
  [Operation.GET_CATALOG]: () => encodeGetCatalogResponse(fakeCatalog(catalogFingerprintByte)),
  [Operation.GET_TOPOLOGY]: () => encodeGetTopologyResponse(TOPOLOGY),
  [Operation.GET_CONFIG]: () => encodeGetConfigResponse(fakeConfig(configHashByte)),
  [Operation.GET_RESOURCES]: () => encodeGetResourcesResponse(RESOURCES),
});

function makeSession(catalogFingerprintByte = 1, configHashByte = 1, cache = new CatalogCache()) {
  const transport = new FakeTransport();
  const client = new SpaghettiClient(transport, { defaultTimeoutMs: 5000, attemptTimeoutMs: 5000 });
  const eventStream = new EventStream(transport);
  const bindingRecord: CoreBindingRecord = {
    bindingId: BINDING_ID.value,
    expectedDeviceId: bytesToHex(DEVICE_ID),
    connectionProfileId: "profile-1",
  };
  const session = new CoreSession(bindingRecord, client, eventStream, cache);
  const responder = new FakeCoreResponder(transport, FULL_HANDLERS(catalogFingerprintByte, configHashByte));
  // Establish identity via a STATUS event before connect() checks it.
  transport.deliverEvent(fakeStatusEvent(1, 1n, 0, 0, DEVICE_ID));
  return { transport, client, eventStream, binding: bindingRecord, session, responder, cache };
}

describe("CoreSession — connect()", () => {
  it("drives DISCONNECTED -> ... -> READY and populates the snapshot", async () => {
    const { session, responder } = makeSession();
    expect(session.state).toBe("DISCONNECTED");

    await runToCompletion(() => session.connect(), responder);

    expect(session.state).toBe("READY");
    expect(session.lastKnownSnapshot.status).toEqual(STATUS);
    expect(session.lastKnownSnapshot.config?.generation).toBe(1);
    expect(session.stale).toBe(false);
  });

  it("caches the catalog per device ID + fingerprint and reuses it on a second connect with the same fingerprint", async () => {
    const cache = new CatalogCache();
    const first = makeSession(1, 1, cache);
    await runToCompletion(() => first.session.connect(), first.responder);
    expect(cache.size).toBe(1);

    const second = makeSession(1, 1, cache); // same fingerprint byte -> cache hit expected
    await runToCompletion(() => second.session.connect(), second.responder);

    expect(second.session.state).toBe("READY");
    // Cache hit means only the cheap first-page peek is sent, never a second full pagination round.
    const catalogRequests = second.transport.sent.filter((b) => decodeRequest(b).operation === Operation.GET_CATALOG);
    expect(catalogRequests).toHaveLength(1);
  });
});

describe("CoreSession — identity", () => {
  it("transitions to ERROR when the connected device reports an unexpected device ID", async () => {
    const transport = new FakeTransport();
    const client = new SpaghettiClient(transport, { defaultTimeoutMs: 5000, attemptTimeoutMs: 5000 });
    const eventStream = new EventStream(transport);
    const mismatchedBinding: CoreBindingRecord = {
      bindingId: BINDING_ID.value,
      expectedDeviceId: "00112233",
      connectionProfileId: "profile-1",
    };
    const session = new CoreSession(mismatchedBinding, client, eventStream, new CatalogCache());
    const responder = new FakeCoreResponder(transport, {
      [Operation.GET_STATUS]: () => encodeGetStatusResponse(STATUS),
      [Operation.GET_CAPABILITIES]: () => encodeGetCapabilitiesResponse(CAPABILITIES),
      [Operation.GET_FEATURES]: () => encodeGetFeaturesResponse(FEATURES),
    });
    transport.deliverEvent(fakeStatusEvent(1, 1n)); // reports DEVICE_ID, which != mismatchedBinding.expectedDeviceId

    await expect(runToCompletion(() => session.connect(), responder)).rejects.toThrow();
    expect(session.state).toBe("ERROR");
  });
});

describe("CoreSession — disconnect / stale", () => {
  it("marks the session stale after being READY once, but keeps the last known snapshot", async () => {
    const { session, responder } = makeSession();
    await runToCompletion(() => session.connect(), responder);

    session.disconnect();

    expect(session.state).toBe("DISCONNECTED");
    expect(session.stale).toBe(true);
    expect(session.lastKnownSnapshot.status).toEqual(STATUS);
  });

  it("does not mark a never-connected session stale", () => {
    const { session } = makeSession();
    session.disconnect();
    expect(session.stale).toBe(false);
  });
});

describe("CoreSession — reboot mid-READY", () => {
  it("returns to SYNCHRONIZING (never silently stays READY) when the boot ID changes", async () => {
    const { session, responder, transport } = makeSession();
    await runToCompletion(() => session.connect(), responder);
    expect(session.state).toBe("READY");

    transport.deliverEvent(fakeStatusEvent(2, 2n, 0, 0, DEVICE_ID)); // boot id changed from 1 to 2
    // The event travels through EventStream's async iterator and CoreSession's
    // background consumer loop — a couple of microtask hops, not just one.
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(session.state).toBe("SYNCHRONIZING");
  });
});

describe("CoreSession — explicit reconciliation actions", () => {
  it("importLiveState() returns the live Config only after connect()", async () => {
    const { session, responder } = makeSession();
    expect(() => session.importLiveState()).toThrow();
    await runToCompletion(() => session.connect(), responder);
    expect(session.importLiveState().generation).toBe(1);
  });

  it("keepProject() is a safe no-op", async () => {
    const { session, responder } = makeSession();
    await runToCompletion(() => session.connect(), responder);
    expect(() => session.keepProject()).not.toThrow();
  });

  it("reconcile() throws, honestly, instead of pretending to merge", () => {
    const { session } = makeSession();
    expect(() => session.reconcile()).toThrow(/S073/);
  });
});

describe("CoreSession — sync classification integration", () => {
  it("wires the live Config hash and the project's own canonical hash into the classifier correctly (PROJECT_DIRTY case)", async () => {
    const { session, responder } = makeSession(1, 42);
    await runToCompletion(() => session.connect(), responder);

    const pid = projectId("dddddddd-0000-4000-8000-000000000001");
    if (!pid.ok) throw new Error("bad fixture id");
    const depId = deploymentId("dddddddd-0000-4000-8000-000000000002");
    if (!depId.ok) throw new Error("bad fixture id");

    const base: ProjectV1 = createEmptyProject(pid.value, "Test project");
    // The live Config hash the fixture Core reports (fakeConfig(42) via makeSession).
    const liveHash = bytesToHex(session.lastKnownSnapshot.config!.sha256);
    // The deployment's sourceProjectHash is deliberately a value distinct
    // from this project's own canonical hash (computing an exact
    // self-referential match is not meaningful — canonicalProjectHash
    // includes deploymentRecords, so a record can never literally record its
    // own post-append hash). What matters here is proving CoreSession reads
    // the *live* Config hash correctly (configHash matches -> not
    // DEVICE_CHANGED) while the project hash mismatch correctly drives
    // PROJECT_DIRTY, not IN_SYNC.
    const project: ProjectV1 = {
      ...base,
      deploymentRecords: [
        {
          deploymentId: depId.value,
          target: session.binding.bindingId,
          timestamp: "2026-01-01T00:00:00.000Z",
          sourceProjectHash: "some-earlier-project-hash",
          configHash: liveHash,
          outcome: "success",
        },
      ],
    };
    expect(canonicalProjectHash(project)).not.toBe("some-earlier-project-hash");

    const relationship = session.syncWithProject(project, true);
    expect(relationship).toBe("PROJECT_DIRTY");
    expect(session.syncRelationship).toBe("PROJECT_DIRTY");
  });
});

import { describe, expect, it } from "vitest";
import { decodeRequest, encodeGetStatusResponse, encodeResponse, EventStream, fakeStatusEvent, FakeTransport, ProtocolStatus, SpaghettiClient, type GetStatusResponse } from "@spaghettilab/protocol-sdk";
import { fetchCoreStatus, watchStatusEvents } from "../status-node.js";

const STATUS_FIXTURE: GetStatusResponse = {
  state: 3,
  mode: 1,
  imageState: 0,
  activeSlot: 0,
  imageConfirmed: true,
  version: "1.2.3",
  portCount: 4,
  lastResetCause: 0,
  healthState: 1,
  modules: [],
};

function respondOkToLastRequest(transport: FakeTransport, payload: Uint8Array): void {
  const lastSent = transport.sent.at(-1);
  if (!lastSent) throw new Error("no request was sent");
  const request = decodeRequest(lastSent);
  transport.deliverResponse(encodeResponse({ correlationId: request.correlationId, status: ProtocolStatus.OK, payload }));
}

async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

describe("fetchCoreStatus — reuses core-status's real describeCoreStatus()", () => {
  it("labels the running/normal/confirmed status the same way the React Flow app does", async () => {
    const transport = new FakeTransport();
    const client = new SpaghettiClient(transport);

    const promise = fetchCoreStatus(client);
    respondOkToLastRequest(transport, encodeGetStatusResponse(STATUS_FIXTURE));

    const view = await promise;
    expect(view.state).toBe("RUNNING");
    expect(view.mode).toBe("NORMAL");
  });
});

describe("watchStatusEvents — same S024 FakeTransport fixtures", () => {
  it("calls onStatusEvent for every STATUS event delivered", async () => {
    const transport = new FakeTransport();
    const stream = new EventStream(transport);
    const seen: Array<{ bootId: bigint; queueDepth: number; dropCount: number }> = [];

    void watchStatusEvents(stream, (bootId, queueDepth, dropCount) => seen.push({ bootId, queueDepth, dropCount }));

    transport.deliverEvent(fakeStatusEvent(1, 7n, 2, 0));
    await flush();

    expect(seen).toEqual([{ bootId: 7n, queueDepth: 2, dropCount: 0 }]);
  });
});

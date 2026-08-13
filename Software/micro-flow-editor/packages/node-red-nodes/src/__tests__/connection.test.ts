import { describe, expect, it } from "vitest";
import { EventStream, FakeTransport, SpaghettiClient } from "@spaghettilab/protocol-sdk";
import { createSpaghettiConnection, disposeSpaghettiConnection } from "../connection.js";

describe("createSpaghettiConnection — one shared transport, client + event stream", () => {
  it("builds a real SpaghettiClient and EventStream over the same transport", () => {
    const transport = new FakeTransport();
    const handle = createSpaghettiConnection(transport);
    expect(handle.client).toBeInstanceOf(SpaghettiClient);
    expect(handle.eventStream).toBeInstanceOf(EventStream);
  });

  it("dispose() cleans up both the client and the event stream without throwing", () => {
    const transport = new FakeTransport();
    const handle = createSpaghettiConnection(transport);
    expect(() => disposeSpaghettiConnection(handle)).not.toThrow();
  });
});

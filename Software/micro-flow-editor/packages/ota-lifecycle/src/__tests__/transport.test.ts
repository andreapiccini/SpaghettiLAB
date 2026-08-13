import { describe, expect, it } from "vitest";
import { canResumeAfterDisconnect, UpdateTransport, updateTransportLabel } from "../transport.js";

describe("canResumeAfterDisconnect — S103 § Implementazione point 1 (resume only if the protocol guarantees it)", () => {
  it("is false for every transport on this firmware version — no session survives a disconnect", () => {
    expect(canResumeAfterDisconnect(UpdateTransport.BLE)).toBe(false);
    expect(canResumeAfterDisconnect(UpdateTransport.UDP)).toBe(false);
    expect(canResumeAfterDisconnect(UpdateTransport.UART)).toBe(false);
    expect(canResumeAfterDisconnect(UpdateTransport.NONE)).toBe(false);
  });
});

describe("updateTransportLabel", () => {
  it("labels every known transport", () => {
    expect(updateTransportLabel(UpdateTransport.BLE)).toBe("BLE");
    expect(updateTransportLabel(UpdateTransport.UDP)).toBe("UDP");
  });
  it("falls back to UNKNOWN(n) for an unrecognized value", () => {
    expect(updateTransportLabel(99)).toBe("UNKNOWN(99)");
  });
});

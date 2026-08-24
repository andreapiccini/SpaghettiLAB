import { describe, expect, it } from "vitest";
import { createConnectionProfile } from "../connection-profile.js";
import { connectionProfileId } from "../ids.js";
import type { Result } from "../result.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw new Error(`expected ok, got err: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

const ID = mustOk(connectionProfileId("cccccccc-0000-4000-8000-0000000000f1"));

describe("createConnectionProfile", () => {
  it("builds a valid profile without a credential reference", () => {
    const profile = mustOk(
      createConnectionProfile({
        connectionProfileId: ID,
        name: "greenhouse mqtt",
        transport: "mqtt",
        host: "10.0.0.5",
        port: 1883,
      }),
    );
    expect(profile.credentialRef).toBeUndefined();
  });

  it("builds a valid profile carrying only an opaque credential reference", () => {
    const profile = mustOk(
      createConnectionProfile({
        connectionProfileId: ID,
        name: "greenhouse mqtt",
        transport: "mqtt",
        host: "10.0.0.5",
        port: 1883,
        credentialRef: "cred://mqtt-broker-01",
      }),
    );
    expect(profile.credentialRef).toBe("cred://mqtt-broker-01");
  });

  it("builds a valid USB profile keyed by device identity, not a hostname", () => {
    const profile = mustOk(
      createConnectionProfile({
        connectionProfileId: ID,
        name: "core-lab",
        transport: "usb",
        host: "907069ad7548",
        port: 1,
      }),
    );
    expect(profile.transport).toBe("usb");
    expect(profile.host).toBe("907069ad7548");
  });

  it("rejects an empty name, unknown transport, empty host, out-of-range port and empty credentialRef together", () => {
    const result = createConnectionProfile({
      connectionProfileId: ID,
      name: "  ",
      // @ts-expect-error — exercising the runtime check, not the type check
      transport: "carrier-pigeon",
      host: "",
      port: 70000,
      credentialRef: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toHaveLength(5);
    expect(result.error.map((e) => e.path.at(-1))).toEqual([
      "name",
      "transport",
      "host",
      "port",
      "credentialRef",
    ]);
  });

  it("has no field capable of holding a secret value — the type only ever exposes an opaque reference", () => {
    const profile = mustOk(
      createConnectionProfile({
        connectionProfileId: ID,
        name: "greenhouse mqtt",
        transport: "mqtt",
        host: "10.0.0.5",
        port: 1883,
        credentialRef: "cred://mqtt-broker-01",
      }),
    );
    const serialized = JSON.stringify(profile);
    const suspiciousKeys = Object.keys(profile).filter((key) =>
      /secret|password|token|apikey/i.test(key),
    );
    expect(suspiciousKeys).toEqual([]);
    // credentialRef is the only field that could carry a secret by mistake —
    // assert it only ever looks like a reference, never a bare value someone
    // pasted in place of the store lookup.
    expect(serialized).not.toMatch(/"credentialRef":"(?!cred:\/\/)/);
  });
});

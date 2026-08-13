import { describe, expect, it, vi } from "vitest";
import { InMemoryCredentialStore } from "@spaghettilab/domain";
import type { DeviceProfileWireClient } from "@spaghettilab/device-profile-install";
import { confirmCredentialRemoval, confirmFirmwareDowngrade, confirmNodeRedResourceDeletion, confirmProfileRemoval } from "../destructive-confirmation.js";

const DEVICE_ID = new Uint8Array([0xab, 0xcd]);

describe("confirmCredentialRemoval — S124 § Verifiche (device ID, scope, consequences shown before confirming)", () => {
  it("refuses without a matching confirmation, never calling store.remove", async () => {
    const store = new InMemoryCredentialStore();
    await store.set("cred-1", "secret-value");
    const result = await confirmCredentialRemoval(store, DEVICE_ID, "cred-1", { target: "wrong", confirmedTarget: "wrong-typed" });
    expect(result.ok).toBe(false);
    expect(await store.get("cred-1")).toBe("secret-value");
  });

  it("removes once the exact displayed target is confirmed back", async () => {
    const store = new InMemoryCredentialStore();
    await store.set("cred-1", "secret-value");
    const target = `device abcd — credential "cred-1" — any Core or service still relying on this credential loses access immediately, with no automatic recovery`;
    const result = await confirmCredentialRemoval(store, DEVICE_ID, "cred-1", { target, confirmedTarget: target });
    expect(result.ok).toBe(true);
    expect(await store.get("cred-1")).toBeNull();
  });
});

describe("confirmProfileRemoval", () => {
  it("refuses before calling the wire when confirmation doesn't match", async () => {
    const removeDeviceProfile = vi.fn();
    const client: DeviceProfileWireClient = { installDeviceProfile: vi.fn(), removeDeviceProfile, validateDeviceProfile: vi.fn() } as unknown as DeviceProfileWireClient;
    const result = await confirmProfileRemoval(client, DEVICE_ID, "profile-1", 1, false, { target: "x", confirmedTarget: "y" });
    expect(result.ok).toBe(false);
    expect(removeDeviceProfile).not.toHaveBeenCalled();
  });

  it("still refuses when referenced locally, even with a matching confirmation — the hard S063 block still applies", async () => {
    const removeDeviceProfile = vi.fn();
    const client: DeviceProfileWireClient = { installDeviceProfile: vi.fn(), removeDeviceProfile, validateDeviceProfile: vi.fn() } as unknown as DeviceProfileWireClient;
    const target = `device abcd — Device Profile "profile-1@1" — every Module using this profile stops sampling once it is removed`;
    const result = await confirmProfileRemoval(client, DEVICE_ID, "profile-1", 1, true, { target, confirmedTarget: target });
    expect(result.ok).toBe(false);
    expect(removeDeviceProfile).not.toHaveBeenCalled();
  });

  it("calls the wire once confirmed and not referenced locally", async () => {
    const removeDeviceProfile = vi.fn().mockResolvedValue(undefined);
    const client: DeviceProfileWireClient = { installDeviceProfile: vi.fn(), removeDeviceProfile, validateDeviceProfile: vi.fn() } as unknown as DeviceProfileWireClient;
    const target = `device abcd — Device Profile "profile-1@1" — every Module using this profile stops sampling once it is removed`;
    const result = await confirmProfileRemoval(client, DEVICE_ID, "profile-1", 1, false, { target, confirmedTarget: target });
    expect(result.ok).toBe(true);
    expect(removeDeviceProfile).toHaveBeenCalled();
  });
});

describe("confirmFirmwareDowngrade", () => {
  it("refuses without matching confirmation", () => {
    const result = confirmFirmwareDowngrade(DEVICE_ID, "1.0.0", "2.0.0", { target: "x", confirmedTarget: "y" });
    expect(result.ok).toBe(false);
  });

  it("allows the override once the exact target is confirmed", () => {
    const target = `device abcd — downgrade from "2.0.0" to "1.0.0" — MCUboot's anti-downgrade gate will still reject this candidate at swap time unless the running image's security counter allows it — this override only lets the transfer proceed, it cannot force the swap`;
    const result = confirmFirmwareDowngrade(DEVICE_ID, "1.0.0", "2.0.0", { target, confirmedTarget: target });
    expect(result.ok).toBe(true);
  });
});

describe("confirmNodeRedResourceDeletion", () => {
  it("refuses without matching confirmation", () => {
    const result = confirmNodeRedResourceDeletion("project-1", ["node-a", "node-b"], { target: "x", confirmedTarget: "y" });
    expect(result.ok).toBe(false);
  });

  it("allows deletion once confirmed, listing the exact node ids in the target", () => {
    const target = "project project-1 — 2 Node-RED node(s) [node-a, node-b] — any in-flight message on these nodes is dropped, not queued";
    const result = confirmNodeRedResourceDeletion("project-1", ["node-a", "node-b"], { target, confirmedTarget: target });
    expect(result.ok).toBe(true);
  });
});

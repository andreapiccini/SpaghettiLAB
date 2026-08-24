import { describe, expect, it } from "vitest";
import { proposeBindingFromDiscovery } from "../discovery-binding.js";
import type { CoreBindingId, CoreBindingRecord } from "@spaghettilab/domain";

describe("proposeBindingFromDiscovery", () => {
  it("creates a new binding when no existing binding matches the device ID", () => {
    const proposed = proposeBindingFromDiscovery(
      [],
      { expectedDeviceId: "aabb", connectionProfileId: "profile-1" },
      "new-binding-id" as CoreBindingId,
    );
    expect(proposed).toEqual({
      bindingId: "new-binding-id",
      expectedDeviceId: "aabb",
      connectionProfileId: "profile-1",
    });
  });

  it("returns the existing binding unchanged when the device ID already has one, never substituting identity", () => {
    const existing: CoreBindingRecord = {
      bindingId: "existing-id" as CoreBindingId,
      expectedDeviceId: "aabb",
      connectionProfileId: "original-profile",
    };
    const proposed = proposeBindingFromDiscovery(
      [existing],
      { expectedDeviceId: "aabb", connectionProfileId: "attacker-or-mistaken-profile" },
      "new-binding-id" as CoreBindingId,
    );
    expect(proposed).toBe(existing);
    expect(proposed.connectionProfileId).toBe("original-profile");
  });
});

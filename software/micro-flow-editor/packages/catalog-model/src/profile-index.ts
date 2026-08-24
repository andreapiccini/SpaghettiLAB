import type { DeviceProfileSummary, ListDeviceProfilesResponse } from "@spaghettilab/protocol-sdk";

export type ProfileIndex = {
  /** Deduplicated by `profileId` + `version` together (the same ID can have multiple installed versions), sorted, order-independent. */
  readonly profiles: readonly DeviceProfileSummary[];
  readonly complete: boolean;
};

function profileKey(entry: DeviceProfileSummary): string {
  return `${entry.profileId}@${entry.version}`;
}

/** Normalizes raw `LIST_DEVICE_PROFILES` pages (S021) into an immutable, order-independent index. */
export function normalizeProfilePages(pages: readonly ListDeviceProfilesResponse[], complete: boolean): ProfileIndex {
  const byKey = new Map<string, DeviceProfileSummary>();
  for (const page of pages) {
    for (const profile of page.profiles) {
      byKey.set(profileKey(profile), profile);
    }
  }
  const profiles = [...byKey.values()].sort((a, b) => {
    if (a.profileId !== b.profileId) return a.profileId < b.profileId ? -1 : 1;
    return a.version - b.version;
  });
  return { profiles, complete };
}

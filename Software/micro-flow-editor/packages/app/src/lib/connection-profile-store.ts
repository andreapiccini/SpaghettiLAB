import type { ConnectionProfile } from "@spaghettilab/domain";
import { localStorageAdapter } from "./repository.js";

const PREFIX = "connection-profiles/";

/**
 * `ConnectionProfile` (domain/src/connection-profile.ts) has a validator but no
 * store of its own yet — `REACT_FLOW_ARCHITECTURE.md` leaves persistence to
 * whoever needs it first. The browser app is that first caller: it needs to turn
 * a `CoreBindingRecord.connectionProfileId` back into a host/port to reconnect,
 * so it keeps profiles in the same namespaced `localStorage` the rest of the app
 * uses (see `LocalStorageAdapter`), keyed by id.
 */
export async function saveConnectionProfile(profile: ConnectionProfile): Promise<void> {
  await localStorageAdapter.set(PREFIX + profile.connectionProfileId, JSON.stringify(profile));
}

/** `id` is `CoreBindingRecord.connectionProfileId`, a plain `string` field (not the branded `ConnectionProfileId`). */
export async function getConnectionProfile(id: string): Promise<ConnectionProfile | undefined> {
  const raw = await localStorageAdapter.get(PREFIX + id);
  if (raw === null) return undefined;
  return JSON.parse(raw) as ConnectionProfile;
}

/** Every profile this browser has ever saved — the Credenziali tab's (UI-S120) only way to enumerate them, since none of this is per-Project. */
export async function listConnectionProfiles(): Promise<readonly ConnectionProfile[]> {
  const keys = await localStorageAdapter.keys(PREFIX);
  const profiles: ConnectionProfile[] = [];
  for (const key of keys) {
    const raw = await localStorageAdapter.get(key);
    if (raw) profiles.push(JSON.parse(raw) as ConnectionProfile);
  }
  return profiles;
}

export async function removeConnectionProfile(id: string): Promise<void> {
  await localStorageAdapter.remove(PREFIX + id);
}

import type { Storage } from "@spaghettilab/domain";

/**
 * Whether the first-launch shell tour has already been shown — same
 * localStorage-flag pattern as `locale.ts`/`ui-mode.ts`: a sync read for
 * first paint plus async load/save through the `Storage` port.
 */
export const TOUR_STORAGE_KEY = "tour.seen";
export const TOUR_LOCAL_STORAGE_KEY = `spaghettilab:${TOUR_STORAGE_KEY}`;

export function parseTourSeen(raw: string | null | undefined): boolean {
  return raw === "1";
}

export async function loadTourSeen(storage: Storage): Promise<boolean> {
  return parseTourSeen(await storage.get(TOUR_STORAGE_KEY));
}

export async function saveTourSeen(storage: Storage, seen: boolean): Promise<void> {
  await storage.set(TOUR_STORAGE_KEY, seen ? "1" : "0");
}

export function readTourSeenFromLocalStorage(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return parseTourSeen(window.localStorage.getItem(TOUR_LOCAL_STORAGE_KEY));
  } catch {
    return false;
  }
}

import type { Storage } from "@spaghettilab/domain";

/** Whether the user dismissed the post-tour "next step" nudge — same flag pattern as `tour.ts`. */
export const HINTS_STORAGE_KEY = "hints.nextStepDismissed";
export const HINTS_LOCAL_STORAGE_KEY = `spaghettilab:${HINTS_STORAGE_KEY}`;

export function parseHintDismissed(raw: string | null | undefined): boolean {
  return raw === "1";
}

export async function saveHintDismissed(storage: Storage, dismissed: boolean): Promise<void> {
  await storage.set(HINTS_STORAGE_KEY, dismissed ? "1" : "0");
}

export function readHintDismissedFromLocalStorage(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return parseHintDismissed(window.localStorage.getItem(HINTS_LOCAL_STORAGE_KEY));
  } catch {
    return false;
  }
}

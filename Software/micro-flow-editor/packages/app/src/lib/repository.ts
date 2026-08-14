import { ProjectAutosaveStore, ProjectRepository } from "@spaghettilab/project-store";
import { BrowserClock } from "./browser-clock.js";
import { BrowserUuidGenerator } from "./browser-uuid.js";
import { LocalStorageAdapter } from "./local-storage-adapter.js";

/** One shared instance for the whole app — `Storage`/`UuidGenerator` adapters are stateless wrappers over browser APIs, no reason for more than one. */
export const localStorageAdapter = new LocalStorageAdapter();
export const projectRepository = new ProjectRepository(localStorageAdapter);
export const uuidGenerator = new BrowserUuidGenerator();
export const browserClock = new BrowserClock();
/**
 * S122's version-history/crash-recovery store (`@spaghettilab/project-store`) —
 * built but never instantiated anywhere in this app until UI-S120's Backup &
 * Versioni tab. It writes a *separate* key layout (`project:<id>:rev:<n>`/
 * `project:<id>:meta`) from `projectRepository`'s plain `project:<id>` key —
 * the two are not interchangeable views of the same data. Only saves made
 * through this store (the Backup & Versioni tab's own "Salva ora") appear in
 * its version history; the Command Palette's regular "Salva progetto" still
 * goes through `projectRepository` and is not reflected here. Unifying the
 * two into one save path is a real, worthwhile follow-up but touches every
 * screen's save flow — out of scope for this task.
 */
export const projectAutosaveStore = new ProjectAutosaveStore(localStorageAdapter, browserClock);

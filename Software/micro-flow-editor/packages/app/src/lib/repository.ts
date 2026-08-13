import { ProjectRepository } from "@spaghettilab/project-store";
import { BrowserUuidGenerator } from "./browser-uuid.js";
import { LocalStorageAdapter } from "./local-storage-adapter.js";

/** One shared instance for the whole app — `Storage`/`UuidGenerator` adapters are stateless wrappers over browser APIs, no reason for more than one. */
export const localStorageAdapter = new LocalStorageAdapter();
export const projectRepository = new ProjectRepository(localStorageAdapter);
export const uuidGenerator = new BrowserUuidGenerator();

import type { CoreBindingId, CoreBindingRecord } from "@spaghettilab/domain";
import type { EventStream, SpaghettiClient } from "@spaghettilab/protocol-sdk";
import { CatalogCache } from "./catalog-cache.js";
import { CoreSession } from "./core-session.js";

/**
 * Manages every `CoreSession` in a project. Each session is independent: a
 * failure inside one (a thrown `connect()`, a decode error) never touches
 * another's state (S030 point 8 "isola errori di un Core: gli altri
 * workspace restano operativi") — this class holds no shared mutable state
 * between sessions besides the catalog cache, which is itself keyed per
 * device (see `catalog-cache.ts`) for the same isolation reason.
 */
export class CoreRegistry {
  private readonly sessions = new Map<CoreBindingId, CoreSession>();
  private readonly catalogCache = new CatalogCache();

  addSession(binding: CoreBindingRecord, client: SpaghettiClient, eventStream: EventStream): CoreSession {
    const session = new CoreSession(binding, client, eventStream, this.catalogCache);
    this.sessions.set(binding.bindingId, session);
    return session;
  }

  get(bindingId: CoreBindingId): CoreSession | undefined {
    return this.sessions.get(bindingId);
  }

  list(): readonly CoreSession[] {
    return [...this.sessions.values()];
  }

  removeSession(bindingId: CoreBindingId): void {
    this.sessions.get(bindingId)?.dispose();
    this.sessions.delete(bindingId);
  }

  disposeAll(): void {
    for (const session of this.sessions.values()) session.dispose();
    this.sessions.clear();
  }
}

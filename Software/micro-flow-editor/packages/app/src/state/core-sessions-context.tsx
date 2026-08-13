import { CatalogCache, CoreSession, type CoreSessionSnapshot, type SessionState, type SyncRelationship } from "@spaghettilab/core-session";
import type { CoreBindingId, CoreBindingRecord, DomainError } from "@spaghettilab/domain";
import { EventStream, SpaghettiClient, WebSocketProtocolTransport, type AcceptDiscoveryRequest, type AcceptDiscoveryResponse, type DeviceProfileSummary, type DiscoveryCandidate } from "@spaghettilab/protocol-sdk";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { connectBrowserWebSocket } from "../lib/browser-websocket-connection.js";
import { useSession } from "./session-context.js";

/**
 * UI-visible view of one Core binding's live session — `CoreSession` itself
 * (`@spaghettilab/core-session`, S030) is a plain class with no React
 * reactivity, so this hook re-derives a plain snapshot object on every
 * relevant change instead of exposing the class instance directly to
 * components (which would silently go stale between renders).
 */
export type CoreRowState = {
  readonly binding: CoreBindingRecord;
  readonly sessionState: SessionState;
  readonly stale: boolean;
  readonly syncRelationship: SyncRelationship | null;
  readonly error: DomainError | string | null;
};

type CoreSessionsContextValue = {
  rows: readonly CoreRowState[];
  connect(binding: CoreBindingRecord, wsUrl: string): Promise<void>;
  cancel(bindingId: CoreBindingId): void;
  /** `lastKnownSnapshot` for a binding's session, if one has ever been created this app session — `undefined` for a binding never connected to. */
  getSnapshot(bindingId: CoreBindingId): CoreSessionSnapshot | undefined;
  /** `undefined` if no session has ever been created for this binding this app session. */
  listDeviceProfiles(bindingId: CoreBindingId): Promise<readonly DeviceProfileSummary[]> | undefined;
  listDiscoveryCandidates(bindingId: CoreBindingId): Promise<readonly DiscoveryCandidate[]> | undefined;
  acceptDiscovery(bindingId: CoreBindingId, req: AcceptDiscoveryRequest): Promise<AcceptDiscoveryResponse> | undefined;
};

const CoreSessionsContext = createContext<CoreSessionsContextValue | undefined>(undefined);

/** One shared `CatalogCache` for the whole app session — S030's own reasoning for why it's keyed by device id + fingerprint together applies across every Core, not per-row. */
const sharedCatalogCache = new CatalogCache();

export function CoreSessionsProvider({ children }: { readonly children: ReactNode }) {
  const { session } = useSession();
  const sessionsRef = useRef(new Map<CoreBindingId, CoreSession>());
  const [renderCount, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);
  const [errors, setErrors] = useState<Map<CoreBindingId, DomainError | string>>(new Map());

  const connect = useCallback(
    async (binding: CoreBindingRecord, wsUrl: string) => {
      setErrors((prev) => {
        const next = new Map(prev);
        next.delete(binding.bindingId);
        return next;
      });
      try {
        const { connection } = await connectBrowserWebSocket(wsUrl);
        const transport = new WebSocketProtocolTransport(connection);
        const client = new SpaghettiClient(transport);
        const eventStream = new EventStream(transport);
        const coreSession = new CoreSession(binding, client, eventStream, sharedCatalogCache);
        sessionsRef.current.set(binding.bindingId, coreSession);
        rerender();

        await coreSession.connect();
        // Optimistic until @spaghettilab/editor-model's compatibility engine (S042) is
        // wired into this screen — a known, documented gap (see UI-S030's task file),
        // not an invented "always compatible" claim about the real device.
        if (session) coreSession.syncWithProject(session.stack.current, true);
        rerender();
      } catch (cause) {
        setErrors((prev) => new Map(prev).set(binding.bindingId, cause instanceof Error ? cause.message : String(cause)));
        rerender();
      }
    },
    [session, rerender],
  );

  const cancel = useCallback(
    (bindingId: CoreBindingId) => {
      const coreSession = sessionsRef.current.get(bindingId);
      coreSession?.disconnect();
      coreSession?.dispose();
      sessionsRef.current.delete(bindingId);
      rerender();
    },
    [rerender],
  );

  const rows = useMemo<readonly CoreRowState[]>(() => {
    const bindings = session?.stack.current.coreBindings ?? [];
    return bindings.map((binding) => {
      const coreSession = sessionsRef.current.get(binding.bindingId);
      return {
        binding,
        sessionState: coreSession?.state ?? "DISCONNECTED",
        stale: coreSession?.stale ?? false,
        syncRelationship: coreSession?.syncRelationship ?? null,
        error: errors.get(binding.bindingId) ?? null,
      };
    });
    // `renderCount` is the actual dependency that matters here — `CoreSession` is a
    // plain mutable class (no reactivity of its own), so `rerender()` bumping this
    // counter after every `connect()`/`cancel()` step is what tells this memo to
    // re-read `sessionsRef.current`, not `sessionsRef` itself (a stable ref object).
  }, [session, errors, renderCount]);

  const getSnapshot = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.lastKnownSnapshot, []);
  const listDeviceProfiles = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.listDeviceProfiles(), []);
  const listDiscoveryCandidates = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.listDiscoveryCandidates(), []);
  const acceptDiscovery = useCallback((bindingId: CoreBindingId, req: AcceptDiscoveryRequest) => sessionsRef.current.get(bindingId)?.acceptDiscovery(req), []);

  const value: CoreSessionsContextValue = { rows, connect, cancel, getSnapshot, listDeviceProfiles, listDiscoveryCandidates, acceptDiscovery };
  return <CoreSessionsContext.Provider value={value}>{children}</CoreSessionsContext.Provider>;
}

export function useCoreSessions(): CoreSessionsContextValue {
  const ctx = useContext(CoreSessionsContext);
  if (!ctx) throw new Error("useCoreSessions() called outside <CoreSessionsProvider>");
  return ctx;
}

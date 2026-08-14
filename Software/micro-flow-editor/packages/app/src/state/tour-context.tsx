import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { localStorageAdapter } from "../lib/repository.js";
import { readTourSeenFromLocalStorage, saveTourSeen } from "../lib/tour.js";
import { useSession } from "./session-context.js";

type TourContextValue = {
  readonly active: boolean;
  readonly stepIndex: number;
  start(): void;
  next(): void;
  prev(): void;
  close(): void;
};

const TourContext = createContext<TourContextValue | undefined>(undefined);

/**
 * `start()` never opens the tour directly — it only arms `pending`. The tour
 * highlights shell zones (`LeftRail`/`TopBar`) that only exist once
 * `AppShell` is mounted, i.e. once a project is open, so calling `start()`
 * from the ProjectPicker (Settings is reachable from there too) would dim
 * the screen over nothing to point at. Arming instead means: fire as soon as
 * a project — this one or the next one opened/created — is actually open,
 * which is also what covers the first-ever-launch auto-start, just gated by
 * the "never seen before" flag instead of an explicit click.
 */
export function TourProvider({ children }: { readonly children: ReactNode }) {
  const { session, navigate } = useSession();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, setPending] = useState(false);
  // React's documented "adjusting state when a prop changes" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect) — `session` only
  // changes reference at `openProject`, so this fires exactly once per
  // project open, same technique `ProcessingGraphScreen` uses to resync
  // `localNodes` from `domainRfNodes`.
  const [seenSession, setSeenSession] = useState<typeof session>(null);
  if (session && session !== seenSession) {
    setSeenSession(session);
    if (!readTourSeenFromLocalStorage()) setPending(true);
  }

  // Fires the moment a project is actually open, whether that's the arming
  // render itself (already inside a project when "Rivedi il tutorial" is
  // clicked) or a later one (armed from the ProjectPicker, project opened
  // afterwards) — same render-time pattern as above, not a useEffect.
  if (session && pending) {
    setPending(false);
    setStepIndex(0);
    setActive(true);
    navigate("core-connections");
  }

  const close = useCallback(() => {
    setActive(false);
    void saveTourSeen(localStorageAdapter, true);
  }, []);

  const start = useCallback(() => {
    setPending(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  return <TourContext.Provider value={{ active, stepIndex, start, next, prev, close }}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour() called outside <TourProvider>");
  return ctx;
}

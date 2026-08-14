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
 * Auto-starts once per browser (localStorage flag, same as `locale`/`ui-mode`)
 * the first time a project is open — the tour highlights shell zones
 * (`LeftRail`/`TopBar`), which only exist once `AppShell` is mounted, so
 * there is nothing to point at before a project is open.
 */
export function TourProvider({ children }: { readonly children: ReactNode }) {
  const { session } = useSession();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // React's documented "adjusting state when a prop changes" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect) — `session` only
  // changes reference at `openProject`, so this fires exactly once per
  // project open, same technique `ProcessingGraphScreen` uses to resync
  // `localNodes` from `domainRfNodes`. A ref can't be read during render
  // (the React Compiler rejects that), so the guard has to be state.
  const [seenSession, setSeenSession] = useState<typeof session>(null);
  if (session && session !== seenSession) {
    setSeenSession(session);
    if (!readTourSeenFromLocalStorage()) {
      setStepIndex(0);
      setActive(true);
    }
  }

  const close = useCallback(() => {
    setActive(false);
    void saveTourSeen(localStorageAdapter, true);
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
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

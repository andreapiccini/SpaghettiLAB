import { CommandStack, type ProjectId, type ProjectV1 } from "@spaghettilab/domain";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { projectRepository } from "../lib/repository.js";

export type ScreenId = "workspace" | "core-connections" | "catalog-topology" | "physical-composition" | "device-profile-studio" | "processing-graph" | "deploy-diff" | "runtime-diagnostics" | "capability-marketplace" | "cross-core-automation" | "settings-security";

type SessionState = {
  readonly projectId: ProjectId;
  readonly stack: CommandStack;
};

type SessionContextValue = {
  readonly session: SessionState | null;
  readonly activeScreen: ScreenId;
  openProject(projectId: ProjectId, project: ProjectV1): void;
  closeProject(): void;
  /** Bumped on every `execute()`/`undo()`/`redo()` so consumers re-render — `CommandStack` itself is a plain mutable class, not React state. */
  revision: number;
  execute: CommandStack["execute"] | undefined;
  undo(): void;
  redo(): void;
  navigate(screen: ScreenId): void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("workspace");
  const [revision, setRevision] = useState(0);

  const openProject = useCallback((projectId: ProjectId, project: ProjectV1) => {
    setSession({ projectId, stack: new CommandStack(project) });
    setActiveScreen("core-connections");
    setRevision((r) => r + 1);
  }, []);

  const closeProject = useCallback(() => {
    setSession(null);
    setActiveScreen("workspace");
  }, []);

  const undo = useCallback(() => {
    if (!session) return;
    session.stack.undo();
    setRevision((r) => r + 1);
  }, [session]);

  const redo = useCallback(() => {
    if (!session) return;
    session.stack.redo();
    setRevision((r) => r + 1);
  }, [session]);

  const execute = useMemo(() => {
    if (!session) return undefined;
    return (command: Parameters<CommandStack["execute"]>[0]) => {
      const result = session.stack.execute(command);
      setRevision((r) => r + 1);
      // Fire-and-forget persistence, same "explicit save stays separate from undo/redo" rule backend-behavior.md documents — a caller wanting a saved checkpoint calls projectRepository.save() itself, this hook does not do it implicitly.
      return result;
    };
  }, [session]);

  const navigate = useCallback((screen: ScreenId) => setActiveScreen(screen), []);

  const value: SessionContextValue = { session, activeScreen, openProject, closeProject, revision, execute, undo, redo, navigate };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession() called outside <SessionProvider>");
  return ctx;
}

/** Persists the currently open project's latest state via `ProjectRepository` — a deliberate, explicit action, never automatic (`REACT_FLOW_ARCHITECTURE.md`). */
export async function saveOpenProject(session: SessionState): Promise<void> {
  await projectRepository.save(session.stack.current);
}

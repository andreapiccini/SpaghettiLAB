import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { localStorageAdapter } from "../lib/repository.js";
import {
  readUiModeFromLocalStorage,
  saveUiMode,
  type UiMode,
} from "../lib/ui-mode.js";

type UiModeContextValue = {
  readonly mode: UiMode;
  setMode(mode: UiMode): void;
};

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

export function UiModeProvider({ children }: { readonly children: ReactNode }) {
  const [mode, setModeState] = useState<UiMode>(readUiModeFromLocalStorage);

  const setMode = useCallback((next: UiMode) => {
    setModeState(next);
    void saveUiMode(localStorageAdapter, next);
  }, []);

  return <UiModeContext.Provider value={{ mode, setMode }}>{children}</UiModeContext.Provider>;
}

export function useUiMode(): UiModeContextValue {
  const ctx = useContext(UiModeContext);
  if (!ctx) throw new Error("useUiMode() called outside <UiModeProvider>");
  return ctx;
}

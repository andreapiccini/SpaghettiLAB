import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
export type SettingsPaneId = string;

type SettingsModalContextValue = {
  readonly open: boolean;
  readonly categoryId: SettingsPaneId;
  openSettings(categoryId?: SettingsPaneId): void;
  closeSettings(): void;
  setCategoryId(categoryId: SettingsPaneId): void;
};

const SettingsModalContext = createContext<SettingsModalContextValue | undefined>(
  undefined,
);

export function SettingsModalProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<SettingsPaneId>("general");

  const openSettings = useCallback((next?: SettingsPaneId) => {
    if (next) setCategoryId(next);
    setOpen(true);
  }, []);

  const closeSettings = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, categoryId, openSettings, closeSettings, setCategoryId }),
    [open, categoryId, openSettings, closeSettings],
  );

  return (
    <SettingsModalContext.Provider value={value}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal(): SettingsModalContextValue {
  const ctx = useContext(SettingsModalContext);
  if (!ctx)
    throw new Error("useSettingsModal() called outside <SettingsModalProvider>");
  return ctx;
}

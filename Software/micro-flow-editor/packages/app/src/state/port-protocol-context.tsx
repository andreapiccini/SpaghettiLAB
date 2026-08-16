import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DIALECT_LABEL,
  DEFAULT_SIGNAL_COUNT,
  defaultPinMap,
  emptyProtocol,
  protocolFromIntegrated,
  protocolFromPreset,
  resizePinMap,
  summarizeConfiguredPort,
  type ConfiguredPortSummary,
  type CustomProtocol,
  type DialectKind,
  type PortPinMap,
} from "../lib/port-protocol-mock.js";

type PortProtocolContextValue = {
  readonly pinMapOf: (portId: number, pinCount?: number) => PortPinMap;
  readonly setPinMap: (map: PortPinMap) => void;
  readonly protocols: readonly CustomProtocol[];
  readonly upsertProtocol: (protocol: CustomProtocol) => void;
  readonly protocolFor: (opts: { readonly moduleNodeId?: string; readonly portId?: number }) => CustomProtocol | undefined;
  readonly bindProtocol: (protocolId: string, opts: { readonly moduleNodeId?: string; readonly portId?: number }) => void;
  readonly createBlankProtocol: (dialect?: DialectKind) => CustomProtocol;
  readonly createFromPreset: (presetId: string) => CustomProtocol | undefined;
  readonly createFromIntegrated: (moduleId: string) => CustomProtocol | undefined;
  readonly savePort: (portId: number) => void;
  readonly configuredPorts: readonly ConfiguredPortSummary[];
};

const PortProtocolContext = createContext<PortProtocolContextValue | undefined>(undefined);

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function PortProtocolProvider({ children }: { readonly children: ReactNode }) {
  const [pinMaps, setPinMaps] = useState<Readonly<Record<number, PortPinMap>>>({});
  const [protocols, setProtocols] = useState<readonly CustomProtocol[]>([]);
  const [savedPortIds, setSavedPortIds] = useState<readonly number[]>([]);

  const pinMapOf = useCallback((portId: number, pinCount = DEFAULT_SIGNAL_COUNT) => {
    const existing = pinMaps[portId];
    return existing ? resizePinMap(existing, pinCount) : defaultPinMap(portId, pinCount);
  }, [pinMaps]);

  const setPinMap = useCallback((map: PortPinMap) => {
    setPinMaps((prev) => ({ ...prev, [map.portId]: map }));
  }, []);

  const upsertProtocol = useCallback((protocol: CustomProtocol) => {
    setProtocols((prev) => {
      const i = prev.findIndex((p) => p.id === protocol.id);
      if (i < 0) return [...prev, protocol];
      const next = [...prev];
      next[i] = protocol;
      return next;
    });
  }, []);

  const protocolFor = useCallback(
    (opts: { readonly moduleNodeId?: string; readonly portId?: number }) => {
      if (opts.moduleNodeId) {
        const byModule = protocols.find((p) => p.moduleNodeId === opts.moduleNodeId);
        if (byModule) return byModule;
      }
      if (opts.portId !== undefined && opts.portId >= 0) {
        return protocols.find((p) => p.portId === opts.portId && !p.moduleNodeId) ?? protocols.find((p) => p.portId === opts.portId);
      }
      return undefined;
    },
    [protocols],
  );

  const bindProtocol = useCallback((protocolId: string, opts: { readonly moduleNodeId?: string; readonly portId?: number }) => {
    setProtocols((prev) => prev.map((p) => (p.id === protocolId ? { ...p, moduleNodeId: opts.moduleNodeId ?? p.moduleNodeId, portId: opts.portId ?? p.portId } : p)));
  }, []);

  const createBlankProtocol = useCallback((dialect?: DialectKind) => {
    const created = emptyProtocol(nextId("proto"), dialect ? DIALECT_LABEL[dialect] : "Protocollo personalizzato", dialect ?? "i2c");
    setProtocols((prev) => [...prev, created]);
    return created;
  }, []);

  const createFromPreset = useCallback((presetId: string) => {
    const created = protocolFromPreset(presetId, nextId("proto"));
    if (created) setProtocols((prev) => [...prev, created]);
    return created;
  }, []);

  const createFromIntegrated = useCallback((moduleId: string) => {
    const created = protocolFromIntegrated(moduleId, nextId("proto"));
    if (created) setProtocols((prev) => [...prev, created]);
    return created;
  }, []);

  const savePort = useCallback((portId: number) => {
    if (portId < 0) return;
    setSavedPortIds((prev) => (prev.includes(portId) ? prev : [...prev, portId]));
  }, []);

  const configuredPorts = useMemo(
    () =>
      savedPortIds.map((portId) =>
        summarizeConfiguredPort(
          portId,
          pinMaps[portId] ?? defaultPinMap(portId),
          protocols.find((p) => p.portId === portId && !p.moduleNodeId) ?? protocols.find((p) => p.portId === portId),
        ),
      ),
    [savedPortIds, pinMaps, protocols],
  );

  const value = useMemo(
    () => ({
      pinMapOf,
      setPinMap,
      protocols,
      upsertProtocol,
      protocolFor,
      bindProtocol,
      createBlankProtocol,
      createFromPreset,
      createFromIntegrated,
      savePort,
      configuredPorts,
    }),
    [pinMapOf, setPinMap, protocols, upsertProtocol, protocolFor, bindProtocol, createBlankProtocol, createFromPreset, createFromIntegrated, savePort, configuredPorts],
  );

  return <PortProtocolContext.Provider value={value}>{children}</PortProtocolContext.Provider>;
}

export function usePortProtocol(): PortProtocolContextValue {
  const ctx = useContext(PortProtocolContext);
  if (!ctx) throw new Error("usePortProtocol() called outside <PortProtocolProvider>");
  return ctx;
}

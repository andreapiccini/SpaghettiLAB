import type { CoreBindingId } from "@spaghettilab/domain";
import { useCallback, useContext, useEffect, useMemo, useRef, useState, createContext, type ReactNode } from "react";
import {
  DIALECT_LABEL,
  DEFAULT_SIGNAL_COUNT,
  defaultPinMap,
  emptyProtocol,
  normalizePinMap,
  protocolFromIntegrated,
  protocolFromPreset,
  resizePinMap,
  summarizeConfiguredPort,
  type ConfiguredPortSummary,
  type CustomProtocol,
  type DialectKind,
  type PortPinMap,
} from "../lib/port-protocol-mock.js";
import { useSession } from "./session-context.js";

export const PORT_AUTHORING_META_KEY = "__portAuthoring";

export type PortCardPosition = { readonly x: number; readonly y: number };

export type PortAuthoringSnapshot = {
  readonly pinMaps: Readonly<Record<string, PortPinMap>>;
  readonly protocols: readonly CustomProtocol[];
  readonly savedPortIds: readonly number[];
  readonly cardPositions: Readonly<Record<string, PortCardPosition>>;
  readonly portCapabilities?: Readonly<Record<string, number>>;
  readonly selectedBindingId?: string;
};

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
  readonly cardPositionOf: (portId: number) => PortCardPosition | undefined;
  readonly setCardPosition: (portId: number, position: PortCardPosition) => void;
  readonly capabilitiesOf: (portId: number) => number | undefined;
  readonly rememberCapabilities: (portId: number, capabilities: number) => void;
  readonly selectedBindingId: CoreBindingId | null;
  readonly setSelectedBindingId: (bindingId: CoreBindingId | null) => void;
};

const PortProtocolContext = createContext<PortProtocolContextValue | undefined>(undefined);

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function parsePortAuthoringSnapshot(raw: unknown): PortAuthoringSnapshot | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<PortAuthoringSnapshot>;
    if (!parsed || typeof parsed !== "object") return undefined;
    return {
      pinMaps: parsed.pinMaps ?? {},
      protocols: parsed.protocols ?? [],
      savedPortIds: parsed.savedPortIds ?? [],
      cardPositions: parsed.cardPositions ?? {},
      portCapabilities: parsed.portCapabilities ?? {},
      selectedBindingId: typeof parsed.selectedBindingId === "string" ? parsed.selectedBindingId : undefined,
    };
  } catch {
    return undefined;
  }
}

function snapshotFromProject(comment: string | undefined): PortAuthoringSnapshot | undefined {
  return parsePortAuthoringSnapshot(comment);
}

function emptySnapshot(): PortAuthoringSnapshot {
  return { pinMaps: {}, protocols: [], savedPortIds: [], cardPositions: {}, portCapabilities: {} };
}

export function PortProtocolProvider({ children }: { readonly children: ReactNode }) {
  const { session, execute } = useSession();
  const projectId = session?.projectId ?? "";
  const stored = snapshotFromProject(session?.stack.current.authoringMetadata[PORT_AUTHORING_META_KEY]?.comment) ?? emptySnapshot();
  const [hydratedFor, setHydratedFor] = useState(projectId);
  const [pinMaps, setPinMaps] = useState<Readonly<Record<number, PortPinMap>>>(() => mapsFromSnapshot(stored));
  const [protocols, setProtocols] = useState<readonly CustomProtocol[]>(stored.protocols);
  const [savedPortIds, setSavedPortIds] = useState<readonly number[]>(stored.savedPortIds);
  const [cardPositions, setCardPositions] = useState<Readonly<Record<string, PortCardPosition>>>(stored.cardPositions);
  const [portCapabilities, setPortCapabilities] = useState<Readonly<Record<number, number>>>(() => capsFromSnapshot(stored));
  const [selectedBindingId, setSelectedBindingId] = useState<CoreBindingId | null>(
    () => (stored.selectedBindingId as CoreBindingId | undefined) ?? null,
  );
  const skipPersist = useRef(true);

  if (hydratedFor !== projectId) {
    const next = snapshotFromProject(session?.stack.current.authoringMetadata[PORT_AUTHORING_META_KEY]?.comment) ?? emptySnapshot();
    setHydratedFor(projectId);
    setPinMaps(mapsFromSnapshot(next));
    setProtocols(next.protocols);
    setSavedPortIds(next.savedPortIds);
    setCardPositions(next.cardPositions);
    setPortCapabilities(capsFromSnapshot(next));
    setSelectedBindingId((next.selectedBindingId as CoreBindingId | undefined) ?? null);
    skipPersist.current = true;
  }

  const pinMapOf = useCallback((portId: number, pinCount = DEFAULT_SIGNAL_COUNT) => {
    const existing = pinMaps[portId];
    return existing ? normalizePinMap(resizePinMap(existing, pinCount)) : defaultPinMap(portId, pinCount);
  }, [pinMaps]);

  const setPinMap = useCallback((map: PortPinMap) => {
    setPinMaps((prev) => ({ ...prev, [map.portId]: map }));
    if (map.pins.some((pin) => pin.peripheral !== "unused")) {
      setSavedPortIds((prev) => (prev.includes(map.portId) ? prev : [...prev, map.portId]));
    }
  }, []);

  const upsertProtocol = useCallback((protocol: CustomProtocol) => {
    setProtocols((prev) => {
      const i = prev.findIndex((p) => p.id === protocol.id);
      if (i < 0) return [...prev, protocol];
      const next = [...prev];
      next[i] = protocol;
      return next;
    });
    if (protocol.portId !== undefined && protocol.portId >= 0) {
      setSavedPortIds((prev) => (prev.includes(protocol.portId!) ? prev : [...prev, protocol.portId!]));
    }
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

  const cardPositionOf = useCallback((portId: number) => cardPositions[String(portId)], [cardPositions]);

  const setCardPosition = useCallback((portId: number, position: PortCardPosition) => {
    setCardPositions((prev) => ({ ...prev, [String(portId)]: position }));
  }, []);

  const capabilitiesOf = useCallback((portId: number) => portCapabilities[portId], [portCapabilities]);

  const rememberCapabilities = useCallback((portId: number, capabilities: number) => {
    setPortCapabilities((prev) => (prev[portId] === capabilities ? prev : { ...prev, [portId]: capabilities }));
  }, []);

  const configuredPorts = useMemo(() => {
    const ids = new Set(savedPortIds);
    for (const map of Object.values(pinMaps)) {
      if (map.pins.some((pin) => pin.peripheral !== "unused")) ids.add(map.portId);
    }
    for (const protocol of protocols) {
      if (protocol.portId !== undefined && protocol.portId >= 0) ids.add(protocol.portId);
    }
    return [...ids]
      .sort((a, b) => a - b)
      .map((portId) =>
        summarizeConfiguredPort(
          portId,
          pinMaps[portId] ? normalizePinMap(pinMaps[portId]!) : defaultPinMap(portId),
          protocols.find((p) => p.portId === portId && !p.moduleNodeId) ?? protocols.find((p) => p.portId === portId),
        ),
      );
  }, [savedPortIds, pinMaps, protocols]);

  useEffect(() => {
    if (!execute || projectId === "") return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      const snapshot: PortAuthoringSnapshot = {
        pinMaps: Object.fromEntries(Object.entries(pinMaps).map(([key, map]) => [key, map])),
        protocols,
        savedPortIds,
        cardPositions,
        portCapabilities: Object.fromEntries(Object.entries(portCapabilities).map(([key, value]) => [key, value])),
        selectedBindingId: selectedBindingId ?? undefined,
      };
      execute({
        kind: "PersistPortAuthoring",
        apply: (project) => ({
          ok: true,
          value: {
            ...project,
            authoringMetadata: {
              ...project.authoringMetadata,
              [PORT_AUTHORING_META_KEY]: { comment: JSON.stringify(snapshot) },
            },
          },
        }),
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [cardPositions, execute, pinMaps, portCapabilities, projectId, protocols, savedPortIds, selectedBindingId]);

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
      cardPositionOf,
      setCardPosition,
      capabilitiesOf,
      rememberCapabilities,
      selectedBindingId,
      setSelectedBindingId,
    }),
    [pinMapOf, setPinMap, protocols, upsertProtocol, protocolFor, bindProtocol, createBlankProtocol, createFromPreset, createFromIntegrated, savePort, configuredPorts, cardPositionOf, setCardPosition, capabilitiesOf, rememberCapabilities, selectedBindingId],
  );

  return <PortProtocolContext.Provider value={value}>{children}</PortProtocolContext.Provider>;
}

function mapsFromSnapshot(snapshot: PortAuthoringSnapshot): Readonly<Record<number, PortPinMap>> {
  const maps: Record<number, PortPinMap> = {};
  for (const [key, map] of Object.entries(snapshot.pinMaps)) {
    maps[Number(key)] = normalizePinMap(map);
  }
  return maps;
}

function capsFromSnapshot(snapshot: PortAuthoringSnapshot): Readonly<Record<number, number>> {
  const caps: Record<number, number> = {};
  for (const [key, value] of Object.entries(snapshot.portCapabilities ?? {})) {
    if (typeof value === "number") caps[Number(key)] = value;
  }
  return caps;
}

export function usePortProtocol(): PortProtocolContextValue {
  const ctx = useContext(PortProtocolContext);
  if (!ctx) throw new Error("usePortProtocol() called outside <PortProtocolProvider>");
  return ctx;
}

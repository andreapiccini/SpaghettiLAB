import type { CompileConfigInput } from "@spaghettilab/config-compiler";
import type { DeploymentContext, DeploymentResult } from "@spaghettilab/config-deployment";
import type { CommandOutcome, RunCommandRequest, ScanOutcome } from "@spaghettilab/core-actions";
import type { DestructiveConfirmation, LeaseOutcome, MaintenanceOutcome, ResetScopeOutcome } from "@spaghettilab/core-admin";
import { CatalogCache, CoreSession, type CoreSessionSnapshot, type SessionState, type SyncRelationship } from "@spaghettilab/core-session";
import type { DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";
import type { InstallProfileResult } from "@spaghettilab/device-profile-install";
import type { CoreBindingId, CoreBindingRecord, DomainError, PermissionSet, Result } from "@spaghettilab/domain";
import { EventStream, SpaghettiClient, WebSerialProtocolTransport, WebSocketProtocolTransport, type AcceptDiscoveryRequest, type AcceptDiscoveryResponse, type AuditLogEntry, type DeviceProfileSummary, type DiscoveryCandidate, type GetConnectivityStatusResponse, type GetJobStatusResponse, type GetUpdateStatusResponse, type ProtocolTransport, type RecordEventPayload } from "@spaghettilab/protocol-sdk";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { connectBrowserWebSocket } from "../lib/browser-websocket-connection.js";
import { openBrowserSerial, type UsbSerialPort } from "../lib/browser-serial-connection.js";
import { coreDisplayName } from "../lib/core-identity.js";
import { useSession } from "./session-context.js";

export type CoreLink =
  | { readonly kind: "websocket"; readonly url: string }
  | { readonly kind: "usb"; readonly port: UsbSerialPort };

export type CoreRowState = {
  readonly binding: CoreBindingRecord;
  readonly displayName: string;
  readonly sessionState: SessionState;
  readonly stale: boolean;
  readonly syncRelationship: SyncRelationship | null;
  readonly error: DomainError | string | null;
};

type CoreSessionsContextValue = {
  rows: readonly CoreRowState[];
  connect(binding: CoreBindingRecord, link: CoreLink): Promise<void>;
  cancel(bindingId: CoreBindingId): void;
  fail(bindingId: CoreBindingId, message: string): void;
  getSnapshot(bindingId: CoreBindingId): CoreSessionSnapshot | undefined;
  listDeviceProfiles(bindingId: CoreBindingId): Promise<readonly DeviceProfileSummary[]> | undefined;
  listDiscoveryCandidates(bindingId: CoreBindingId): Promise<readonly DiscoveryCandidate[]> | undefined;
  acceptDiscovery(bindingId: CoreBindingId, req: AcceptDiscoveryRequest): Promise<AcceptDiscoveryResponse> | undefined;
  installProfile(bindingId: CoreBindingId, draft: DeviceProfileDraft): Promise<Result<InstallProfileResult, DomainError>> | undefined;
  removeProfile(bindingId: CoreBindingId, profileId: string, version: number, options: { readonly isReferencedLocally: boolean }): Promise<Result<void, DomainError>> | undefined;
  deployConfig(bindingId: CoreBindingId, input: CompileConfigInput, context: DeploymentContext): Promise<DeploymentResult> | undefined;
  onRecordEvent(bindingId: CoreBindingId, listener: (payload: RecordEventPayload) => void): (() => void) | undefined;
  getLastBootId(bindingId: CoreBindingId): bigint | null | undefined;
  runCommand(bindingId: CoreBindingId, req: RunCommandRequest, granted: PermissionSet): Promise<CommandOutcome> | undefined;
  requestScan(bindingId: CoreBindingId, req: { readonly portId: number; readonly invasive: boolean }, granted: PermissionSet): Promise<ScanOutcome> | undefined;
  getJobStatus(bindingId: CoreBindingId, jobId: number): Promise<GetJobStatusResponse> | undefined;
  getConnectivityStatus(bindingId: CoreBindingId): Promise<GetConnectivityStatusResponse> | undefined;
  getAuditLog(bindingId: CoreBindingId): Promise<readonly AuditLogEntry[]> | undefined;
  acquireLease(bindingId: CoreBindingId, services: number, durationMs: number, granted: PermissionSet): Promise<LeaseOutcome> | undefined;
  releaseLease(bindingId: CoreBindingId, granted: PermissionSet): Promise<LeaseOutcome> | undefined;
  openNetworkMaintenance(bindingId: CoreBindingId, granted: PermissionSet, confirmation: DestructiveConfirmation): Promise<MaintenanceOutcome> | undefined;
  requestFactoryReset(bindingId: CoreBindingId, scope: number, granted: PermissionSet, confirmation: DestructiveConfirmation): Promise<ResetScopeOutcome> | undefined;
  getUpdateStatus(bindingId: CoreBindingId): Promise<GetUpdateStatusResponse> | undefined;
  getClient(bindingId: CoreBindingId): SpaghettiClient | undefined;
};

const CoreSessionsContext = createContext<CoreSessionsContextValue | undefined>(undefined);

const sharedCatalogCache = new CatalogCache();

async function openLink(link: CoreLink): Promise<{ transport: ProtocolTransport; dispose: () => void }> {
  if (link.kind === "websocket") {
    const { connection, socket } = await connectBrowserWebSocket(link.url);
    const transport = new WebSocketProtocolTransport(connection);
    return {
      transport,
      dispose: () => {
        transport.dispose();
        socket.close();
      },
    };
  }
  const connection = await openBrowserSerial(link.port);
  const transport = new WebSerialProtocolTransport(connection);
  return {
    transport,
    dispose: () => {
      transport.dispose();
      void connection.close();
    },
  };
}

export function CoreSessionsProvider({ children }: { readonly children: ReactNode }) {
  const { session } = useSession();
  const sessionsRef = useRef(new Map<CoreBindingId, CoreSession>());
  const disposersRef = useRef(new Map<CoreBindingId, () => void>());
  const [renderCount, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);
  const [errors, setErrors] = useState<Map<CoreBindingId, DomainError | string>>(new Map());

  const connect = useCallback(
    async (binding: CoreBindingRecord, link: CoreLink) => {
      setErrors((prev) => {
        const next = new Map(prev);
        next.delete(binding.bindingId);
        return next;
      });
      sessionsRef.current.get(binding.bindingId)?.disconnect();
      sessionsRef.current.get(binding.bindingId)?.dispose();
      sessionsRef.current.delete(binding.bindingId);
      disposersRef.current.get(binding.bindingId)?.();
      disposersRef.current.delete(binding.bindingId);
      try {
        const opened = await openLink(link);
        disposersRef.current.set(binding.bindingId, opened.dispose);
        const client = new SpaghettiClient(opened.transport);
        const eventStream = new EventStream(opened.transport);
        const coreSession = new CoreSession(binding, client, eventStream, sharedCatalogCache);
        sessionsRef.current.set(binding.bindingId, coreSession);
        rerender();

        await coreSession.connect();
        if (session) coreSession.syncWithProject(session.stack.current, true);
        rerender();
      } catch (cause) {
        sessionsRef.current.get(binding.bindingId)?.disconnect();
        sessionsRef.current.get(binding.bindingId)?.dispose();
        sessionsRef.current.delete(binding.bindingId);
        disposersRef.current.get(binding.bindingId)?.();
        disposersRef.current.delete(binding.bindingId);
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
      disposersRef.current.get(bindingId)?.();
      disposersRef.current.delete(bindingId);
      rerender();
    },
    [rerender],
  );

  const fail = useCallback((bindingId: CoreBindingId, message: string) => {
    setErrors((prev) => new Map(prev).set(bindingId, message));
    rerender();
  }, [rerender]);

  const rows = useMemo<readonly CoreRowState[]>(() => {
    const bindings = session?.stack.current.coreBindings ?? [];
    return bindings.map((binding) => {
      const coreSession = sessionsRef.current.get(binding.bindingId);
      const deviceName = coreSession?.lastKnownSnapshot.status?.deviceName;
      return {
        binding,
        displayName: coreDisplayName(deviceName, binding.expectedDeviceId),
        sessionState: coreSession?.state ?? "DISCONNECTED",
        stale: coreSession?.stale ?? false,
        syncRelationship: coreSession?.syncRelationship ?? null,
        error: errors.get(binding.bindingId) ?? null,
      };
    });
  }, [session, errors, renderCount]);

  const getSnapshot = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.lastKnownSnapshot, []);
  const listDeviceProfiles = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.listDeviceProfiles(), []);
  const listDiscoveryCandidates = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.listDiscoveryCandidates(), []);
  const acceptDiscovery = useCallback((bindingId: CoreBindingId, req: AcceptDiscoveryRequest) => sessionsRef.current.get(bindingId)?.acceptDiscovery(req), []);
  const installProfile = useCallback((bindingId: CoreBindingId, draft: DeviceProfileDraft) => sessionsRef.current.get(bindingId)?.installProfile(draft), []);
  const removeProfile = useCallback(
    (bindingId: CoreBindingId, profileId: string, version: number, options: { readonly isReferencedLocally: boolean }) => sessionsRef.current.get(bindingId)?.removeProfile(profileId, version, options),
    [],
  );
  const deployConfig = useCallback((bindingId: CoreBindingId, input: CompileConfigInput, context: DeploymentContext) => sessionsRef.current.get(bindingId)?.deployConfig(input, context), []);
  const onRecordEvent = useCallback(
    (bindingId: CoreBindingId, listener: (payload: RecordEventPayload) => void) => sessionsRef.current.get(bindingId)?.onRecordEvent(listener),
    [],
  );
  const getLastBootId = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.lastBootId, []);
  const runCommand = useCallback(
    (bindingId: CoreBindingId, req: RunCommandRequest, granted: PermissionSet) => sessionsRef.current.get(bindingId)?.runCommand(req, granted),
    [],
  );
  const requestScan = useCallback(
    (bindingId: CoreBindingId, req: { readonly portId: number; readonly invasive: boolean }, granted: PermissionSet) => sessionsRef.current.get(bindingId)?.requestScan(req, granted),
    [],
  );
  const getJobStatus = useCallback((bindingId: CoreBindingId, jobId: number) => sessionsRef.current.get(bindingId)?.getJobStatus(jobId), []);
  const getConnectivityStatus = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.getConnectivityStatus(), []);
  const getAuditLog = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.getAuditLog(), []);
  const acquireLease = useCallback(
    (bindingId: CoreBindingId, services: number, durationMs: number, granted: PermissionSet) => sessionsRef.current.get(bindingId)?.acquireLease(services, durationMs, granted),
    [],
  );
  const releaseLease = useCallback((bindingId: CoreBindingId, granted: PermissionSet) => sessionsRef.current.get(bindingId)?.releaseLease(granted), []);
  const openNetworkMaintenance = useCallback(
    (bindingId: CoreBindingId, granted: PermissionSet, confirmation: DestructiveConfirmation) => sessionsRef.current.get(bindingId)?.openNetworkMaintenance(granted, confirmation),
    [],
  );
  const requestFactoryReset = useCallback(
    (bindingId: CoreBindingId, scope: number, granted: PermissionSet, confirmation: DestructiveConfirmation) => sessionsRef.current.get(bindingId)?.requestFactoryReset(scope, granted, confirmation),
    [],
  );
  const getUpdateStatus = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.getUpdateStatus(), []);
  const getClient = useCallback((bindingId: CoreBindingId) => sessionsRef.current.get(bindingId)?.client, []);

  const value: CoreSessionsContextValue = {
    rows,
    connect,
    cancel,
    fail,
    getSnapshot,
    listDeviceProfiles,
    listDiscoveryCandidates,
    acceptDiscovery,
    installProfile,
    removeProfile,
    deployConfig,
    onRecordEvent,
    getLastBootId,
    runCommand,
    requestScan,
    getJobStatus,
    getConnectivityStatus,
    getAuditLog,
    acquireLease,
    releaseLease,
    openNetworkMaintenance,
    requestFactoryReset,
    getUpdateStatus,
    getClient,
  };
  return <CoreSessionsContext.Provider value={value}>{children}</CoreSessionsContext.Provider>;
}

export function useCoreSessions(): CoreSessionsContextValue {
  const ctx = useContext(CoreSessionsContext);
  if (!ctx) throw new Error("useCoreSessions() called outside <CoreSessionsProvider>");
  return ctx;
}

import { useEffect } from "react";
import { AppShell } from "./components/shell/AppShell.js";
import { ScreenStub } from "./components/shell/ScreenStub.js";
import { ProjectPicker } from "./components/project-picker/ProjectPicker.js";
import { CoreConnectionsScreen } from "./components/core-connections/CoreConnectionsScreen.js";
import { CatalogTopologyScreen } from "./components/catalog-topology/CatalogTopologyScreen.js";
import { PhysicalCompositionScreen } from "./components/physical-composition/PhysicalCompositionScreen.js";
import { DeviceProfileStudioScreen } from "./components/device-profile-studio/DeviceProfileStudioScreen.js";
import { ProcessingGraphScreen } from "./components/processing-graph/ProcessingGraphScreen.js";
import { DeployDiffScreen } from "./components/deploy-diff/DeployDiffScreen.js";
import { RuntimeDiagnosticsScreen } from "./components/runtime-diagnostics/RuntimeDiagnosticsScreen.js";
import { CapabilityMarketplaceScreen } from "./components/capability-marketplace/CapabilityMarketplaceScreen.js";
import { CrossCoreAutomationScreen } from "./components/cross-core-automation/CrossCoreAutomationScreen.js";
import { SettingsSecurityScreen } from "./components/settings-security/SettingsSecurityScreen.js";
import { isScreenVisibleInMode } from "./lib/ui-mode.js";
import { CoreSessionsProvider } from "./state/core-sessions-context.js";
import { SessionProvider, useSession } from "./state/session-context.js";
import { NodeRedRuntimeProvider } from "./state/node-red-runtime-context.js";
import { UiModeProvider, useUiMode } from "./state/ui-mode-context.js";

const SCREEN_TITLES: Record<string, { readonly title: string; readonly task: string }> = {
  "runtime-diagnostics": { title: "Runtime & Diagnostics", task: "UI-S090" },
  "capability-marketplace": { title: "Capability Marketplace & OTA", task: "UI-S100" },
  "cross-core-automation": { title: "Cross-Core Automation", task: "UI-S110" },
  "settings-security": { title: "Settings, Security & Recovery", task: "UI-S120" },
};

function AppContent() {
  const { session, activeScreen, navigate } = useSession();
  const { mode } = useUiMode();

  useEffect(() => {
    if (!isScreenVisibleInMode(activeScreen, mode)) {
      navigate("core-connections");
    }
  }, [activeScreen, mode, navigate]);

  if (!session) return <ProjectPicker />;

  if (activeScreen === "core-connections") {
    return (
      <AppShell>
        <CoreConnectionsScreen />
      </AppShell>
    );
  }

  if (activeScreen === "catalog-topology") {
    return (
      <AppShell>
        <CatalogTopologyScreen />
      </AppShell>
    );
  }

  if (activeScreen === "physical-composition") {
    return (
      <AppShell>
        <PhysicalCompositionScreen />
      </AppShell>
    );
  }

  if (activeScreen === "device-profile-studio") {
    return (
      <AppShell>
        <DeviceProfileStudioScreen />
      </AppShell>
    );
  }

  if (activeScreen === "processing-graph") {
    return (
      <AppShell>
        <ProcessingGraphScreen />
      </AppShell>
    );
  }

  if (activeScreen === "deploy-diff") {
    return (
      <AppShell>
        <DeployDiffScreen />
      </AppShell>
    );
  }

  if (activeScreen === "runtime-diagnostics") {
    return (
      <AppShell>
        <RuntimeDiagnosticsScreen />
      </AppShell>
    );
  }

  if (activeScreen === "capability-marketplace") {
    return (
      <AppShell>
        <CapabilityMarketplaceScreen />
      </AppShell>
    );
  }

  if (activeScreen === "cross-core-automation") {
    return (
      <AppShell>
        <CrossCoreAutomationScreen />
      </AppShell>
    );
  }

  if (activeScreen === "settings-security") {
    return (
      <AppShell>
        <SettingsSecurityScreen />
      </AppShell>
    );
  }

  const stub = SCREEN_TITLES[activeScreen];
  return <AppShell>{stub ? <ScreenStub title={stub.title} task={stub.task} /> : <ScreenStub title={activeScreen} task="?" />}</AppShell>;
}

export default function App() {
  return (
    <UiModeProvider>
      <NodeRedRuntimeProvider>
        <SessionProvider>
          <CoreSessionsProvider>
            <AppContent />
          </CoreSessionsProvider>
        </SessionProvider>
      </NodeRedRuntimeProvider>
    </UiModeProvider>
  );
}

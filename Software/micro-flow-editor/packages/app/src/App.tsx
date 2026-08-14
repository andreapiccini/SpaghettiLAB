import { AppShell } from "./components/shell/AppShell.js";
import { ScreenStub } from "./components/shell/ScreenStub.js";
import { ProjectPicker } from "./components/project-picker/ProjectPicker.js";
import { CoreConnectionsScreen } from "./components/core-connections/CoreConnectionsScreen.js";
import { CatalogTopologyScreen } from "./components/catalog-topology/CatalogTopologyScreen.js";
import { PhysicalCompositionScreen } from "./components/physical-composition/PhysicalCompositionScreen.js";
import { DeviceProfileStudioScreen } from "./components/device-profile-studio/DeviceProfileStudioScreen.js";
import { ProcessingGraphScreen } from "./components/processing-graph/ProcessingGraphScreen.js";
import { CoreSessionsProvider } from "./state/core-sessions-context.js";
import { SessionProvider, useSession } from "./state/session-context.js";

const SCREEN_TITLES: Record<string, { readonly title: string; readonly task: string }> = {
  "deploy-diff": { title: "Deploy & Diff", task: "UI-S080" },
  "runtime-diagnostics": { title: "Runtime & Diagnostics", task: "UI-S090" },
  "capability-marketplace": { title: "Capability Marketplace & OTA", task: "UI-S100" },
  "cross-core-automation": { title: "Cross-Core Automation", task: "UI-S110" },
  "settings-security": { title: "Settings, Security & Recovery", task: "UI-S120" },
};

function AppContent() {
  const { session, activeScreen } = useSession();

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

  const stub = SCREEN_TITLES[activeScreen];
  return <AppShell>{stub ? <ScreenStub title={stub.title} task={stub.task} /> : <ScreenStub title={activeScreen} task="?" />}</AppShell>;
}

export default function App() {
  return (
    <SessionProvider>
      <CoreSessionsProvider>
        <AppContent />
      </CoreSessionsProvider>
    </SessionProvider>
  );
}

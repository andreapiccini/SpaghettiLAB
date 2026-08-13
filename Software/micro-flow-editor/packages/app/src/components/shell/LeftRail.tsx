import { Activity, Blocks, Boxes, Cable, FileCode, GitCompareArrows, PanelLeftClose, PanelLeftOpen, Settings, Share2, Store, Workflow } from "lucide-react";
import { useState } from "react";
import type { ScreenId } from "../../state/session-context.js";
import { useSession } from "../../state/session-context.js";

type RailItem = { readonly id: ScreenId; readonly label: string; readonly icon: typeof Cable };

const GROUPS: readonly { readonly items: readonly RailItem[] }[] = [
  {
    items: [
      { id: "core-connections", label: "Core Connections", icon: Cable },
      { id: "catalog-topology", label: "Catalog & Topology", icon: Boxes },
      { id: "physical-composition", label: "Physical Composition", icon: Blocks },
      { id: "device-profile-studio", label: "Device Profiles", icon: FileCode },
    ],
  },
  {
    items: [
      { id: "processing-graph", label: "Processing Graph", icon: Workflow },
      { id: "deploy-diff", label: "Deploy & Diff", icon: GitCompareArrows },
      { id: "runtime-diagnostics", label: "Runtime & Diagnostics", icon: Activity },
    ],
  },
  {
    items: [
      { id: "capability-marketplace", label: "Capability Marketplace", icon: Store },
      { id: "cross-core-automation", label: "Cross-Core Automation", icon: Share2 },
      { id: "settings-security", label: "Settings", icon: Settings },
    ],
  },
];

/** `UX_ARCHITECTURE.md` § Shell applicativa — 64px collapsed / 240px expanded, three groups separated by a thin divider. */
export function LeftRail() {
  const { activeScreen, navigate } = useSession();
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className={`flex h-full flex-col border-r border-border bg-surface py-3 transition-[width] duration-200 ${expanded ? "w-60" : "w-16"}`}>
      <div className="flex flex-col gap-1 px-2">
        {GROUPS.map((group, i) => (
          <div key={i} className={i > 0 ? "mt-3 border-t border-border pt-3" : undefined}>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`mb-1 flex h-10 w-full items-center gap-3 rounded-slsm px-3 font-body text-sm ${active ? "bg-brand-blue/10 text-brand-blue" : "text-ink-muted hover:bg-surface-raised"}`}
                >
                  <Icon size={18} className="shrink-0" />
                  {expanded && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-auto px-2">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex h-10 w-full items-center gap-3 rounded-slsm px-3 text-ink-faint hover:bg-surface-raised" aria-label={expanded ? "Comprimi" : "Espandi"}>
          {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
    </nav>
  );
}
